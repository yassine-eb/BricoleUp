import { Component, AfterViewInit, ViewEncapsulation, inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminDashboardComponent implements AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  private charts: any[] = [];

  ngAfterViewInit(): void {
    const token = this.auth.getAccessToken();
    if (!token) {
      this.router.navigate(['/admin-login']);
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>(`${environment.apiUrl}/auth/admin/stats/`, { headers }).subscribe({
      next: (s) => this.render(s),
      error: () => this.showError('Session admin invalide ou expiree. Reconnecte-toi depuis la page admin.'),
    });
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }

  private set(id: string, val: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  private showError(message: string): void {
    const el = document.getElementById('adminDashboardError');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  private render(s: any): void {
    this.set('db-total', s.total_users);
    this.set('db-prestataires', s.prestataires_actifs);
    this.set('db-kyc', s.kyc_pending);
    this.set('db-annonces', s.total_annonces ?? '—');
    this.set('db-total-sub', `+${s.new_users_month} ce mois`);
    this.set('db-prest-sub', `+${s.prestataires_month} ce mois`);
    this.set('db-annonces-sub', `+${s.annonces_month ?? 0} ce mois`);

    const c = s.charts;
    if (!c) return;

    this.loadChartJs().then(() => {
      const Chart = (window as any).Chart;

      const defaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      };

      // ── Inscriptions mensuelles (ligne)
      this.makeChart('chartSignups', 'line', c.signups_monthly.labels, [{
        data: c.signups_monthly.data,
        borderColor: '#1B3C6B',
        backgroundColor: 'rgba(27,60,107,0.08)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#1B3C6B',
        tension: 0.4,
        fill: true,
      }], { ...defaults, plugins: { legend: { display: false }, tooltip: { mode: 'index' } } });

      // ── Annonces mensuelles (barres)
      this.makeChart('chartAnnonces', 'bar', c.annonces_monthly.labels, [{
        data: c.annonces_monthly.data,
        backgroundColor: 'rgba(249,115,22,0.75)',
        borderRadius: 6,
        borderSkipped: false,
      }], defaults);

      // ── Répartition rôles (donut)
      this.makeChart('chartRoles', 'doughnut', c.roles.labels, [{
        data: c.roles.data,
        backgroundColor: ['#1B3C6B', '#F97316', '#22C55E'],
        borderWidth: 0,
        hoverOffset: 8,
      }], {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 16 } } },
      });

      // ── Inscriptions 7 jours (barres mini)
      this.makeChart('chartDaily', 'bar', c.signups_daily.labels, [{
        data: c.signups_daily.data,
        backgroundColor: '#1B3C6B',
        borderRadius: 5,
        borderSkipped: false,
      }], { ...defaults, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } } });
    });
  }

  private makeChart(id: string, type: string, labels: string[], datasets: any[], options: any): void {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (!canvas) return;
    const Chart = (window as any).Chart;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
    const chart = new Chart(canvas, { type, data: { labels, datasets }, options });
    this.charts.push(chart);
  }

  private loadChartJs(): Promise<void> {
    if ((window as any).Chart) return Promise.resolve();
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      s.onload = () => resolve();
      document.head.appendChild(s);
    });
  }
}
