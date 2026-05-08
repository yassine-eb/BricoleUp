import { Component, AfterViewInit, ViewEncapsulation, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-demandes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./demandes.component.css'],
  template: `
    <!-- NAVBAR -->
    <nav class="dm-navbar">
      <div class="dm-navbar-inner">
        <a routerLink="/" class="dm-logo">
          <span class="dm-logo-b">Bricole</span><span class="dm-logo-u">Up</span>
        </a>
        <div class="dm-nav-links">
          <a routerLink="/annonces" class="dm-nav-link">Feed</a>
          <a routerLink="/demandes" class="dm-nav-link active">Demandes</a>
        </div>
        <a routerLink="/" class="dm-back-btn">← Retour</a>
      </div>
    </nav>

    <!-- HERO -->
    <div class="dm-hero">
      <div class="dm-hero-inner">
        <div class="dm-hero-badge">🔍 {{ total }} demandes publiées</div>
        <h1 class="dm-hero-title">Les dernières <span>demandes</span></h1>
        <p class="dm-hero-sub">Trouvez des clients qui ont besoin de vos services dès maintenant</p>
        <!-- SEARCH + FILTERS -->
        <div class="dm-search-row">
          <div class="dm-search-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input #searchInput class="dm-search-input" type="search" placeholder="Rechercher une demande..." (input)="onSearch(searchInput.value)">
          </div>
        </div>
        <!-- CHIPS -->
        <div class="dm-chips">
          <button class="dm-chip" [class.active]="activeSkill === ''" (click)="filterBySkill('')">Toutes</button>
          <button class="dm-chip" *ngFor="let s of skillList" [class.active]="activeSkill === s" (click)="filterBySkill(s)">{{ s }}</button>
        </div>
      </div>
    </div>

    <!-- CONTENT -->
    <div class="dm-content">
      <div class="dm-grid" *ngIf="filtered.length > 0; else empty">
        <article class="dm-card" *ngFor="let a of filtered">
          <!-- Image -->
          <div class="dm-card-img" *ngIf="getImg(a)">
            <img [src]="getImg(a)" [alt]="a.skills?.[0]?.name_fr || 'Demande'" loading="lazy">
          </div>
          <div class="dm-card-img dm-card-img-placeholder" *ngIf="!getImg(a)">
            <span>🔧</span>
          </div>

          <!-- Body -->
          <div class="dm-card-body">
            <!-- Header -->
            <div class="dm-card-header">
              <div class="dm-card-meta">
                <span class="dm-skill-tag" *ngIf="a.skills?.[0]?.name_fr">{{ a.skills[0].name_fr }}</span>
                <span class="dm-time">{{ timeAgo(a.created_at) }}</span>
              </div>
              <span class="dm-budget-pill">{{ getBudget(a) }}</span>
            </div>

            <!-- User -->
            <div class="dm-user-row">
              <img *ngIf="getProfilePic(a)" [src]="getProfilePic(a)!" class="dm-avatar-img" [alt]="a.created_by?.username">
              <div *ngIf="!getProfilePic(a)" class="dm-avatar-initials" [style.background]="colorFor(a.created_by?.username || '')">
                {{ (a.created_by?.username || 'U').slice(0,2).toUpperCase() }}
              </div>
              <div class="dm-user-info">
                <div class="dm-username">{{ a.created_by?.username || 'Utilisateur' }}</div>
                <div class="dm-city" *ngIf="a.city?.name_fr">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ a.city.name_fr }}
                </div>
              </div>
              <span class="dm-replies" [class.has]="(a.messages_sent || 0) > 0">
                {{ (a.messages_sent || 0) > 0 ? (a.messages_sent + ' réponse' + (a.messages_sent > 1 ? 's' : '')) : 'Aucune réponse' }}
              </span>
            </div>

            <!-- Description -->
            <p class="dm-desc">{{ (a.description || '').replace('\\r\\n', ' ').slice(0, 180) }}…</p>

            <!-- Footer -->
            <div class="dm-card-footer">
              <button class="dm-btn-primary">💬 Répondre</button>
              <button class="dm-btn-ghost" (click)="toggleLike($event)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                J'aime
              </button>
            </div>
          </div>
        </article>
      </div>

      <ng-template #empty>
        <div class="dm-empty" *ngIf="!loading">
          <div class="dm-empty-icon">🔍</div>
          <p>Aucune demande trouvée</p>
        </div>
      </ng-template>

      <div class="dm-loading" *ngIf="loading">
        <div class="dm-spinner"></div>
        <p>Chargement des demandes…</p>
      </div>

      <div class="dm-load-more" *ngIf="!allLoaded && !loading && filtered.length > 0">
        <button class="dm-btn-load" (click)="loadMore()">Charger plus ↓</button>
      </div>
    </div>
  `
})
export class DemandesComponent implements AfterViewInit {
  private http = inject(HttpClient);

  demandes: any[] = [];
  filtered: any[] = [];
  skillList: string[] = [];
  activeSkill = '';
  searchQuery = '';
  total = 0;
  loading = false;
  allLoaded = false;
  private page = 1;

  ngAfterViewInit(): void {
    this.load();
  }

  load(): void {
    if (this.loading || this.allLoaded) return;
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/v1/annonces/?page=${this.page}&limit=20`).subscribe({
      next: (res) => {
        const all: any[] = Array.isArray(res) ? res : (res.results ?? res.annonces ?? []);
        // Filtrer uniquement les demandes (catégorie 1)
        const newDemandes = all.filter((a: any) =>
          a.category?.id === 1 || !a.category?.name_fr?.toLowerCase().includes('offre')
        );
        this.demandes = [...this.demandes, ...newDemandes];
        this.total = this.demandes.length;
        this.buildSkillList();
        this.applyFilters();
        this.page++;
        if (all.length < 20) this.allLoaded = true;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadMore(): void { this.load(); }

  private buildSkillList(): void {
    const skills = new Set<string>();
    this.demandes.forEach(a => a.skills?.forEach((s: any) => { if (s.name_fr) skills.add(s.name_fr); }));
    this.skillList = Array.from(skills).slice(0, 12);
  }

  filterBySkill(skill: string): void {
    this.activeSkill = skill;
    this.applyFilters();
  }

  onSearch(q: string): void {
    this.searchQuery = q.toLowerCase();
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filtered = this.demandes.filter(a => {
      const matchSkill = !this.activeSkill || a.skills?.some((s: any) => s.name_fr === this.activeSkill);
      const matchSearch = !this.searchQuery ||
        (a.description || '').toLowerCase().includes(this.searchQuery) ||
        (a.created_by?.username || '').toLowerCase().includes(this.searchQuery) ||
        (a.city?.name_fr || '').toLowerCase().includes(this.searchQuery) ||
        (a.skills?.[0]?.name_fr || '').toLowerCase().includes(this.searchQuery);
      return matchSkill && matchSearch;
    });
  }

  getImg(a: any): string | null {
    return a.image1 || a.image2 || a.image3 || null;
  }

  getProfilePic(a: any): string | null {
    const url = a.created_by?.profile?.profile_picture_url;
    return url && !url.includes('defaultprofile') ? url : null;
  }

  getBudget(a: any): string {
    if (a.a_convenir) return 'À convenir';
    if (a.budget_min && a.budget_max) return `${a.budget_min} – ${a.budget_max} €`;
    if (a.budget_min) return `${a.budget_min} €`;
    return 'À convenir';
  }

  timeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 172800) return 'hier';
    return `il y a ${Math.floor(diff / 86400)}j`;
  }

  colorFor(name: string): string {
    const colors = ['#1B3C6B','#EA580C','#16A34A','#7C3AED','#D97706','#0891B2','#DC2626'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
    return colors[h];
  }

  toggleLike(e: Event): void {
    const btn = e.currentTarget as HTMLElement;
    btn.classList.toggle('liked');
  }
}
