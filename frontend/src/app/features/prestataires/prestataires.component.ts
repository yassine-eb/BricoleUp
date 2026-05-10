import { Component, AfterViewInit, ViewEncapsulation, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-prestataires',
  standalone: true,
  imports: [CommonModule, RouterLink],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./prestataires.component.css'],
  template: `

    <!-- HERO -->
    <div class="ps-hero">
      <div class="ps-hero-inner">
        <div class="ps-hero-badge">⚡ {{ total }} prestataires disponibles</div>
        <h1 class="ps-hero-title">Trouvez le bon <span>prestataire</span></h1>
        <p class="ps-hero-sub">Des professionnels et particuliers qualifiés prêts à intervenir</p>
        <div class="ps-search-row">
          <div class="ps-search-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input #searchInput class="ps-search-input" type="search" placeholder="Rechercher un prestataire, un métier..." (input)="onSearch(searchInput.value)">
          </div>
        </div>
        <div class="ps-chips">
          <button class="ps-chip" [class.active]="activeSkill === ''" (click)="filterBySkill('')">Tous</button>
          <button class="ps-chip" *ngFor="let s of skillList" [class.active]="activeSkill === s" (click)="filterBySkill(s)">{{ s }}</button>
        </div>
      </div>
    </div>

    <!-- CONTENU -->
    <div class="ps-content">

      <!-- STATS BAR -->
      <div class="ps-stats-bar">
        <div class="ps-stat">
          <span class="ps-stat-val">{{ total }}</span>
          <span class="ps-stat-label">Prestataires</span>
        </div>
        <div class="ps-stat-sep"></div>
        <div class="ps-stat">
          <span class="ps-stat-val">{{ verifies }}</span>
          <span class="ps-stat-label">Vérifiés Pro</span>
        </div>
        <div class="ps-stat-sep"></div>
        <div class="ps-stat">
          <span class="ps-stat-val">{{ skillList.length }}+</span>
          <span class="ps-stat-label">Métiers</span>
        </div>
      </div>

      <!-- GRID -->
      <div class="ps-grid" *ngIf="filtered.length > 0; else empty">
        <article class="ps-card" *ngFor="let a of filtered">

          <!-- Avatar + bannière -->
          <div class="ps-card-banner" [style.background]="getColor(a)">
            <img *ngIf="getImg(a)" [src]="getImg(a)!" alt="photo" class="ps-card-banner-img" loading="lazy">
            <div class="ps-card-banner-overlay"></div>
            <div class="ps-card-banner-info">
              <span class="ps-badge-skill" *ngIf="getSkill(a)">{{ getSkill(a) }}</span>
            </div>
          </div>

          <!-- Avatar flottant -->
          <div class="ps-avatar-float">
            <img *ngIf="getProfilePic(a)" [src]="getProfilePic(a)!" class="ps-avatar-img" [alt]="getUsername(a)">
            <div *ngIf="!getProfilePic(a)" class="ps-avatar-initials" [style.background]="getColor(a)">
              {{ getUsername(a).slice(0,2).toUpperCase() }}
            </div>
            <span class="ps-verif-dot" [class.verified]="isVerified(a)" title="Vérifié"></span>
          </div>

          <!-- Body -->
          <div class="ps-card-body">
            <div class="ps-name-row">
              <div>
                <div class="ps-username">{{ getUsername(a) }}</div>
                <div class="ps-metier" *ngIf="getSkill(a)">{{ getSkill(a) }}</div>
              </div>
              <span class="ps-pro-badge" *ngIf="isVerified(a)">Pro ✓</span>
            </div>

            <div class="ps-city" *ngIf="getCity(a)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ getCity(a) }}
            </div>

            <p class="ps-desc" *ngIf="getDesc(a)">{{ getDesc(a).slice(0, 100) }}{{ getDesc(a).length > 100 ? '…' : '' }}</p>

            <div class="ps-card-footer">
              <button class="ps-btn-primary" (click)="contact(a)">💬 Contacter</button>
              <button class="ps-btn-ghost" (click)="toggleFav($event, a)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                Favoris
              </button>
              <button class="ps-btn-ghost" [routerLink]="['/profil', getSlug(a)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profil
              </button>
            </div>
          </div>
        </article>
      </div>

      <ng-template #empty>
        <div class="ps-empty" *ngIf="!loading">
          <div class="ps-empty-icon">🔍</div>
          <p>Aucun prestataire trouvé</p>
        </div>
      </ng-template>

      <div class="ps-loading" *ngIf="loading">
        <div class="ps-spinner"></div>
        <p>Chargement…</p>
      </div>

      <div class="ps-load-more" *ngIf="!allLoaded && !loading && filtered.length > 0">
        <button class="ps-btn-load" (click)="loadMore()">Charger plus ↓</button>
      </div>
    </div>
  `
})
export class PrestatairesComponent implements AfterViewInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  offres: any[] = [];
  filtered: any[] = [];
  skillList: string[] = [];
  activeSkill = '';
  searchQuery = '';
  total = 0;
  verifies = 0;
  loading = false;
  allLoaded = false;
  private page = 1;

  ngAfterViewInit(): void { this.load(); }

  load(): void {
    if (this.loading || this.allLoaded) return;
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/v1/prestataires/?page=${this.page}`).subscribe({
      next: (res) => {
        const all: any[] = res.results ?? (Array.isArray(res) ? res : []);
        this.offres = [...this.offres, ...all];
        if (this.page === 1) {
          this.total = res.total ?? this.offres.length;
          this.verifies = res.verifies ?? 0;
        }
        this.buildSkillList();
        this.applyFilters();
        this.page++;
        if (!res.has_next || all.length === 0) this.allLoaded = true;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadMore(): void { this.load(); }

  private buildSkillList(): void {
    const skills = new Set<string>();
    this.offres.forEach(a => {
      (a.skills ?? []).forEach((s: any) => { if (s.name_fr) skills.add(s.name_fr); });
    });
    this.skillList = Array.from(skills).slice(0, 14);
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
    this.filtered = this.offres.filter(a => {
      const matchSkill = !this.activeSkill || (a.skills ?? []).some((s: any) => s.name_fr === this.activeSkill);
      const matchSearch = !this.searchQuery ||
        (a.bio || '').toLowerCase().includes(this.searchQuery) ||
        (a.user?.username || '').toLowerCase().includes(this.searchQuery) ||
        (typeof a.city === 'string' ? a.city : (a.city?.name_fr || '')).toLowerCase().includes(this.searchQuery);
      return matchSkill && matchSearch;
    });
  }

  // Backend retourne: slug, profile_picture, is_verified, bio, city (string), skills, user.username
  getImg(a: any): string | null {
    const pic = a.profile_picture;
    return pic && !pic.includes('defaultprofile') ? pic : null;
  }

  getExtraImgs(a: any): string[] { return []; }

  getProfilePic(a: any): string | null { return this.getImg(a); }

  getUsername(a: any): string {
    return a.user?.username || 'Prestataire';
  }

  getCity(a: any): string {
    return typeof a.city === 'string' ? a.city : (a.city?.name_fr || '');
  }

  getSkill(a: any): string {
    return a.skills?.[0]?.name_fr || '';
  }

  getDesc(a: any): string {
    return a.bio || '';
  }

  getSlug(a: any): string {
    return a.slug || '';
  }

  isVerified(a: any): boolean {
    return a.is_verified || false;
  }

  getColor(a: any): string {
    return this.colorFor(this.getUsername(a));
  }

  cleanDesc(desc: string): string {
    return (desc || '').replace(/\r\n|\r|\n/g, ' ').trim().slice(0, 180);
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

  toggleFav(e: Event, a: any): void {
    const btn = e.currentTarget as HTMLElement;
    btn.classList.toggle('faved');
  }

  contact(a: any): void {
    const slug = this.getSlug(a);
    if (slug) this.router.navigate(['/messages'], { queryParams: { slug } });
  }
}
