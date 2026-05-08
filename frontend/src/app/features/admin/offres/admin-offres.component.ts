import { Component, AfterViewInit, OnDestroy, ViewEncapsulation, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-offres',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './admin-offres.component.html',
  styleUrls: ['./admin-offres.component.css'],
})
export class AdminOffresComponent implements AfterViewInit, OnDestroy {
  private http   = inject(HttpClient);
  private auth   = inject(AuthService);

  loading    = signal(true);
  error      = signal('');
  allOffres  = signal<any[]>([]);
  filtered   = signal<any[]>([]);
  activeTab  = signal('all');
  searchQ    = '';
  toast      = signal('');
  toastType  = signal<'green'|'red'>('green');
  private toastTimer: any;

  private get headers() {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getAccessToken()}` });
  }

  ngAfterViewInit(): void { this.load(); }
  ngOnDestroy(): void { clearTimeout(this.toastTimer); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<any[]>(`${environment.apiUrl}/auth/admin/offres/`, { headers: this.headers }).subscribe({
      next: (data) => {
        this.allOffres.set(data || []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les offres.');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
    this.applyFilters();
  }

  onSearch(q: string): void {
    this.searchQ = q.toLowerCase();
    this.applyFilters();
  }

  applyFilters(): void {
    let list = this.allOffres();
    if (this.activeTab() !== 'all') list = list.filter(o => o.status === this.activeTab());
    if (this.searchQ) {
      list = list.filter(o =>
        o.sender?.username?.toLowerCase().includes(this.searchQ) ||
        o.announcement?.description?.toLowerCase().includes(this.searchQ) ||
        o.announcement?.client?.toLowerCase().includes(this.searchQ)
      );
    }
    this.filtered.set(list);
  }

  count(status: string): number {
    if (status === 'all') return this.allOffres().length;
    return this.allOffres().filter(o => o.status === status).length;
  }

  accept(id: number): void {
    this.http.post<any>(`${environment.apiUrl}/auth/admin/offres/${id}/accept/`, {}, { headers: this.headers }).subscribe({
      next: () => {
        this.updateStatus(id, 'accepted');
        this.showToast('✓ Offre acceptée', 'green');
      },
      error: () => this.showToast('Erreur lors de l\'acceptation', 'red'),
    });
  }

  refuse(id: number): void {
    this.http.post<any>(`${environment.apiUrl}/auth/admin/offres/${id}/refuse/`, {}, { headers: this.headers }).subscribe({
      next: () => {
        this.updateStatus(id, 'refused');
        this.showToast('✗ Offre refusée', 'red');
      },
      error: () => this.showToast('Erreur lors du refus', 'red'),
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer définitivement cette offre ?')) return;
    this.http.delete<any>(`${environment.apiUrl}/auth/admin/offres/${id}/delete/`, { headers: this.headers }).subscribe({
      next: () => {
        this.allOffres.update(l => l.filter(o => o.id !== id));
        this.applyFilters();
        this.showToast('🗑 Offre supprimée', 'red');
      },
      error: () => this.showToast('Erreur lors de la suppression', 'red'),
    });
  }

  private updateStatus(id: number, status: string): void {
    this.allOffres.update(l => l.map(o => o.id === id ? { ...o, status } : o));
    this.applyFilters();
  }

  private showToast(msg: string, type: 'green'|'red'): void {
    this.toast.set(msg);
    this.toastType.set(type);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 3500);
  }

  statusLabel(s: string): string {
    return s === 'accepted' ? '✅ Acceptée' : s === 'refused' ? '❌ Refusée' : '⏳ En attente';
  }

  statusClass(s: string): string {
    return s === 'accepted' ? 'badge-accepted' : s === 'refused' ? 'badge-refused' : 'badge-pending';
  }

  timeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 172800) return 'hier';
    return `il y a ${Math.floor(diff / 86400)}j`;
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
}
