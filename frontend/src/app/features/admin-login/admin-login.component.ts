import { Component, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .al-page {
      min-height: 100vh;
      display: flex;
      font-family: 'DM Sans', system-ui, sans-serif;
      background: #0A1628;
    }

    /* ===== LEFT PANEL ===== */
    .al-left {
      width: 52%;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding: 60px 72px;
      overflow: hidden;
      background: linear-gradient(135deg, #0A1628 0%, #1B3C6B 60%, #0d2a50 100%);
    }
    .al-left::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 20% 50%, rgba(249,115,22,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 80% at 80% 20%, rgba(37,99,235,0.15) 0%, transparent 60%);
    }
    .al-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .al-left-content { position: relative; z-index: 1; }

    .al-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 64px;
    }
    .al-logo-text {
      font-family: 'Poppins', system-ui, sans-serif;
      font-size: 2rem;
      font-weight: 800;
      line-height: 1;
    }
    .al-logo-text .b { color: #fff; }
    .al-logo-text .u { color: #F97316; }
    .al-logo-badge {
      background: rgba(249,115,22,0.2);
      border: 1px solid rgba(249,115,22,0.4);
      color: #F97316;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: 'Poppins', sans-serif;
    }

    .al-heading {
      font-family: 'Poppins', system-ui, sans-serif;
      font-size: 2.8rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.15;
      margin-bottom: 20px;
    }
    .al-heading span {
      background: linear-gradient(90deg, #F97316, #fbbf24);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .al-sub {
      color: rgba(255,255,255,0.55);
      font-size: 1rem;
      line-height: 1.7;
      max-width: 400px;
      margin-bottom: 56px;
    }

    .al-stats {
      display: flex;
      gap: 32px;
    }
    .al-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .al-stat-val {
      font-family: 'Poppins', sans-serif;
      font-size: 1.6rem;
      font-weight: 800;
      color: #fff;
    }
    .al-stat-label {
      font-size: 0.78rem;
      color: rgba(255,255,255,0.45);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .al-stat-sep {
      width: 1px;
      background: rgba(255,255,255,0.1);
      align-self: stretch;
    }

    .al-orbs {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .al-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.18;
    }
    .al-orb-1 { width: 300px; height: 300px; background: #F97316; top: -80px; right: -80px; }
    .al-orb-2 { width: 200px; height: 200px; background: #2563EB; bottom: 60px; left: 40px; }

    /* ===== RIGHT PANEL ===== */
    .al-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F4F7FB;
      padding: 40px 32px;
    }

    .al-card {
      width: 100%;
      max-width: 440px;
    }

    .al-card-header {
      margin-bottom: 36px;
    }
    .al-card-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.8rem;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 8px;
    }
    .al-card-sub {
      color: #64748B;
      font-size: 0.9rem;
    }

    .al-form { display: flex; flex-direction: column; gap: 16px; }

    .al-field { display: flex; flex-direction: column; gap: 8px; }
    .al-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #0F172A;
      font-family: 'DM Sans', sans-serif;
    }
    .al-input-wrap { position: relative; }
    .al-input-icon {
      position: absolute;
      top: 50%;
      left: 16px;
      transform: translateY(-50%);
      color: #94A3B8;
      display: flex;
    }
    .al-input {
      width: 100%;
      padding: 14px 16px 14px 44px;
      border: 1.5px solid #E2E8F0;
      border-radius: 10px;
      font: 0.95rem 'DM Sans', sans-serif;
      color: #0F172A;
      background: #fff;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    .al-input:focus {
      border-color: #1B3C6B;
      box-shadow: 0 0 0 3px rgba(27,60,107,0.08);
    }
    .al-eye {
      position: absolute;
      top: 50%;
      right: 14px;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: #94A3B8;
      display: flex;
      padding: 4px;
    }
    .al-eye:hover { color: #1B3C6B; }

    .al-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #DC2626;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 0.85rem;
    }

    .al-btn {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #1B3C6B, #2563EB);
      color: #fff;
      border: none;
      border-radius: 10px;
      font: 700 1rem 'Poppins', sans-serif;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .al-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
    .al-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .al-security {
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: #94A3B8;
      font-size: 0.78rem;
    }

    .al-spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .al-left { display: none; }
      .al-right {
        width: 100% !important;
        background: linear-gradient(135deg, #0A1628 0%, #1B3C6B 100%);
        padding: 24px 20px;
        align-items: center;
      }
      .al-card {
        background: #fff;
        border-radius: 20px;
        padding: 28px 22px;
        box-shadow: 0 20px 60px rgba(0,0,0,.4);
        width: 100%;
        max-width: 100%;
      }
    }
    @media (max-width: 480px) {
      .al-card { padding: 22px 16px; }
    }
  `],
  template: `
    <div class="al-page">

      <!-- LEFT -->
      <div class="al-left">
        <div class="al-grid"></div>
        <div class="al-orbs">
          <div class="al-orb al-orb-1"></div>
          <div class="al-orb al-orb-2"></div>
        </div>
        <div class="al-left-content">
          <div class="al-logo">
            <div class="al-logo-text"><span class="b">Bricole</span><span class="u">Up</span></div>
            <span class="al-logo-badge">ADMIN</span>
          </div>
          <h1 class="al-heading">
            Tableau de bord<br><span>administrateur</span>
          </h1>
          <p class="al-sub">
            Gérez les utilisateurs, les annonces, les paiements et toute la plateforme depuis un seul espace sécurisé.
          </p>
          <div class="al-stats">
            <div class="al-stat">
              <span class="al-stat-val">2 847</span>
              <span class="al-stat-label">Utilisateurs</span>
            </div>
            <div class="al-stat-sep"></div>
            <div class="al-stat">
              <span class="al-stat-val">12K+</span>
              <span class="al-stat-label">Annonces/mois</span>
            </div>
            <div class="al-stat-sep"></div>
            <div class="al-stat">
              <span class="al-stat-val">98%</span>
              <span class="al-stat-label">Satisfaction</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="al-right">
        <div class="al-card">
          <div class="al-card-header">
            <h2 class="al-card-title">Connexion Admin</h2>
            <p class="al-card-sub">Accès réservé aux administrateurs BricoleUp</p>
          </div>

          <form class="al-form" (submit)="onSubmit($event)">

            @if (error()) {
              <div class="al-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/>
                </svg>
                {{ error() }}
              </div>
            }

            <div class="al-field">
              <label class="al-label">Adresse e-mail</label>
              <div class="al-input-wrap">
                <span class="al-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input class="al-input" type="email" placeholder="admin@gmail.com"
                       [value]="email()" (input)="email.set($any($event.target).value)"
                       autocomplete="username" required>
              </div>
            </div>

            <div class="al-field">
              <label class="al-label">Mot de passe</label>
              <div class="al-input-wrap">
                <span class="al-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input class="al-input" [type]="showPwd() ? 'text' : 'password'"
                       placeholder="••••••••"
                       [value]="password()" (input)="password.set($any($event.target).value)"
                       autocomplete="current-password" required>
                <button class="al-eye" type="button" (click)="showPwd.set(!showPwd())">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    @if (showPwd()) {
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    } @else {
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button class="al-btn" type="submit" [disabled]="loading()">
              @if (loading()) {
                <div class="al-spinner"></div>
                Connexion en cours...
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Accéder au tableau de bord
              }
            </button>
          </form>

          <div class="al-security">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Connexion sécurisée · Accès restreint aux administrateurs
          </div>
        </div>
      </div>

    </div>
  `,
})
export class AdminLoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('admin@gmail.com');
  password = signal('');
  showPwd = signal(false);
  loading = signal(false);
  error = signal('');

  onSubmit(e: Event): void {
    e.preventDefault();
    this.error.set('');
    this.loading.set(true);

    this.auth.login({ email: this.email(), password: this.password() }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.admin || res.redirect === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.error.set('Accès refusé. Ce compte n\'a pas les droits administrateur.');
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err?.error?.error || 'Identifiants incorrects.');
      },
    });
  }
}
