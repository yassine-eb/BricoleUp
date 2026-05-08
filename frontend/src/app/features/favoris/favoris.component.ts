import { Component, OnInit, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-favoris',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './favoris.component.html',
  styleUrls: ['./favoris.component.css'],
})
export class FavorisComponent implements OnInit {
  private http   = inject(HttpClient);
  private auth   = inject(AuthService);
  private router = inject(Router);

  loading    = signal(true);
  favoris    = signal<any[]>([]);
  likedCards = signal<any[]>([]);
  activeTab  = signal<'favoris' | 'likes'>('favoris');

  ngOnInit(): void {
    this.loadFavoris();
    this.loadLikes();
  }

  private headers() {
    const token = this.auth.getAccessToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private loadFavoris(): void {
    const token = this.auth.getAccessToken();
    if (!token) { this.loading.set(false); return; }
    this.http.get<any[]>(`${environment.apiUrl}/v1/favorites/`, { headers: this.headers() }).subscribe({
      next: (data) => { this.favoris.set(data || []); this.loading.set(false); },
      error: () => { this.favoris.set([]); this.loading.set(false); },
    });
  }

  private loadLikes(): void {
    const raw = localStorage.getItem('bu_liked_cards');
    if (raw) {
      try { this.likedCards.set(JSON.parse(raw)); } catch { this.likedCards.set([]); }
    }
  }

  setTab(tab: 'favoris' | 'likes'): void { this.activeTab.set(tab); }

  voirProfil(slug: string): void { this.router.navigate(['/profil', slug]); }

  removeFavori(slug: string): void {
    this.http.post(`${environment.apiUrl}/v1/favorites/${slug}/favorite/`, {}, { headers: this.headers() }).subscribe({
      next: () => this.favoris.update(list => list.filter(f => f.slug !== slug)),
    });
  }

  removeLike(id: number): void {
    const updated = this.likedCards().filter(c => c.id !== id);
    this.likedCards.set(updated);
    localStorage.setItem('bu_liked_cards', JSON.stringify(updated));
  }

  initials(name: string): string {
    return (name || '?').slice(0, 2).toUpperCase();
  }

  colorFor(name: string): string {
    const colors = ['#1B3C6B','#EA580C','#16A34A','#7C3AED','#D97706','#0891B2','#DC2626'];
    let h = 0;
    for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
    return colors[h];
  }
}
