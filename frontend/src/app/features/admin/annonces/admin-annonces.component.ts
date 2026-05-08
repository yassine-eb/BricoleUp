import { Component, OnInit, OnDestroy, ViewEncapsulation, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-annonces',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './admin-annonces.component.html',
  styleUrls: ['./admin-annonces.component.css'],
})
export class AdminAnnoncesComponent implements OnInit, OnDestroy {
  private http  = inject(HttpClient);
  private auth  = inject(AuthService);

  loading    = signal(true);
  allData    = signal<any[]>([]);
  activeTab  = signal('all');
  searchQ    = signal('');
  typeFilter = signal('');
  ageFilter  = signal('');

  toast     = signal('');
  toastType = signal<'green'|'red'|'blue'>('green');
  private toastTimer: any;
  private simInterval: any;

  // Computed — filtrage réactif
  filtered = computed(() => {
    let list = this.allData();
    const tab = this.activeTab();
    if (tab !== 'all') list = list.filter(a => a.moderation_status === tab);
    const q = this.searchQ().toLowerCase();
    if (q) list = list.filter(a =>
      a.titre?.toLowerCase().includes(q) ||
      a.auteur?.toLowerCase().includes(q) ||
      a.cat?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q)
    );
    const type = this.typeFilter();
    if (type) list = list.filter(a => a.type === type);
    const age = this.ageFilter();
    if (age === '1h')   list = list.filter(a => this.ageMs(a.soumiseTs) < 3600000);
    if (age === '24h')  list = list.filter(a => this.ageMs(a.soumiseTs) >= 3600000 && this.ageMs(a.soumiseTs) < 86400000);
    if (age === '+24h') list = list.filter(a => this.ageMs(a.soumiseTs) >= 86400000);
    // Tri : plus ancien en premier (priorité)
    return [...list].sort((a, b) => a.soumiseTs - b.soumiseTs);
  });

  count(status: string) {
    if (status === 'all') return this.allData().length;
    return this.allData().filter(a => a.moderation_status === status).length;
  }

  private get headers() {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getAccessToken()}` });
  }

  ngOnInit(): void {
    this.loadFromApi();
    // Simulation nouvelle annonce toutes les 10s
    this.simInterval = setInterval(() => this.loadFromApi(), 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.simInterval);
    clearTimeout(this.toastTimer);
  }

  loadFromApi(): void {
    this.loading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/auth/admin/annonces/?status=all`, { headers: this.headers }).subscribe({
      next: (items) => {
        const mapped = (items || []).map((a: any) => ({
          _id:    a.id,
          id:     `ANN-${String(a.id).padStart(4,'0')}`,
          titre:  (a.description || '').slice(0, 80),
          desc:   a.description || '',
          auteur: a.author?.username || 'Inconnu',
          role:   a.author?.is_verified ? 'pro' : 'client',
          email:  a.author?.email || '',
          slug:   a.author?.slug || '',
          type:   a.type || 'demande',
          cat:    a.category || '🔧 Divers',
          soumiseTs:    new Date(a.created_at).getTime(),
          photos:       0,
          urgent:       false,
          budget:       a.budget_min ? `${a.budget_min}${a.budget_max ? ' – '+a.budget_max : ''} €` : '',
          moderation_status: a.moderation_status || 'approved',
          moderation_note:   a.moderation_note || '',
        }));
        this.allData.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Erreur de chargement', 'red');
      },
    });
  }

  approve(item: any): void {
    this.http.post<any>(`${environment.apiUrl}/auth/admin/annonces/${item._id}/approve/`, {}, { headers: this.headers }).subscribe({
      next: () => {
        this.allData.update(l => l.map(a => a._id === item._id ? {...a, moderation_status:'approved'} : a));
        this.showToast(`✓ ${item.id} approuvée et publiée`, 'green');
      },
      error: () => this.showToast('Erreur lors de l\'approbation', 'red'),
    });
  }

  reject(item: any, reason: string): void {
    this.http.post<any>(`${environment.apiUrl}/auth/admin/annonces/${item._id}/reject/`, { reason }, { headers: this.headers }).subscribe({
      next: () => {
        this.allData.update(l => l.map(a => a._id === item._id ? {...a, moderation_status:'rejected', moderation_note:reason} : a));
        this.showToast(`✗ ${item.id} rejetée`, 'red');
      },
      error: () => this.showToast('Erreur lors du rejet', 'red'),
    });
  }

  openRejectModal(item: any): void {
    const reason = prompt(`Motif du rejet pour ${item.id} :`);
    if (reason !== null) this.reject(item, reason || 'Non spécifié');
  }

  showToast(msg: string, type: 'green'|'red'|'blue'): void {
    this.toast.set(msg);
    this.toastType.set(type);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 4000);
  }

  ageMs(ts: number): number { return Date.now() - ts; }

  ageLabel(ts: number): string {
    const h = this.ageMs(ts) / 3600000;
    const s = this.ageMs(ts) / 1000;
    let txt = '';
    if (s < 3600) txt = `il y a ${Math.floor(s/60)} min`;
    else if (s < 86400) txt = `il y a ${Math.floor(s/3600)}h`;
    else txt = `il y a ${Math.floor(s/86400)}j`;
    if (h > 24) return `🔴 ${txt}`;
    if (h > 5)  return `🟡 ${txt}`;
    return txt;
  }

  ageClass(ts: number): string {
    const h = this.ageMs(ts) / 3600000;
    if (h > 24) return 'age-urgent';
    if (h > 5)  return 'age-warn';
    return 'age-ok';
  }

  rowBg(item: any): string {
    return (this.ageMs(item.soumiseTs) > 86400000 && item.moderation_status === 'pending') ? '#FEF9F9' : '';
  }

  statusBadge(s: string): string {
    if (s === 'approved') return '<span class="pill" style="background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0">✅ Approuvée</span>';
    if (s === 'rejected') return '<span class="pill" style="background:#FEF2F2;color:#EF4444;border:1px solid #FECACA">❌ Rejetée</span>';
    return '';
  }

  initials(name: string): string {
    return (name || '?').slice(0, 2).toUpperCase();
  }

  colorFor(name: string): string {
    const c = ['#1B3C6B','#EA580C','#16A34A','#7C3AED','#D97706','#0891B2','#DC2626'];
    let h = 0;
    for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) % c.length;
    return c[h];
  }

  resetFilters(): void {
    this.searchQ.set('');
    this.typeFilter.set('');
    this.ageFilter.set('');
  }
}
