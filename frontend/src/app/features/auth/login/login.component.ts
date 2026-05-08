import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
  ],
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      background: #0f172a;
      font-family: "DM Sans", system-ui, sans-serif;
    }

    /* Panneau gauche décoratif */
    .login-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px;
      background: linear-gradient(135deg, #132d52 0%, #1B3C6B 60%, #1e4a82 100%);
      position: relative;
      overflow: hidden;
    }
    .login-left::before {
      content: '';
      position: absolute;
      width: 500px; height: 500px;
      border-radius: 50%;
      background: rgba(249,115,22,0.08);
      top: -150px; right: -150px;
    }
    .login-left::after {
      content: '';
      position: absolute;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: rgba(249,115,22,0.05);
      bottom: -80px; left: -80px;
    }
    .left-logo {
      font-family: "Poppins", sans-serif;
      font-size: 2rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 48px;
      position: relative; z-index: 1;
    }
    .left-logo span { color: #F97316; }
    .left-tagline {
      font-family: "Poppins", sans-serif;
      font-size: 2.2rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.25;
      margin-bottom: 20px;
      position: relative; z-index: 1;
    }
    .left-sub {
      color: rgba(255,255,255,0.6);
      font-size: 1rem;
      line-height: 1.7;
      max-width: 400px;
      position: relative; z-index: 1;
    }
    .left-stats {
      display: flex;
      gap: 32px;
      margin-top: 48px;
      position: relative; z-index: 1;
    }
    .stat-item { display: flex; flex-direction: column; gap: 4px; }
    .stat-val {
      font-family: "Poppins", sans-serif;
      font-size: 1.6rem;
      font-weight: 800;
      color: #F97316;
    }
    .stat-label { color: rgba(255,255,255,0.55); font-size: .82rem; }

    /* Panneau droit — formulaire */
    .login-right {
      width: 480px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 40px;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
    }
    .card-header { margin-bottom: 36px; }
    .card-logo {
      font-family: "Poppins", sans-serif;
      font-size: 1.5rem;
      font-weight: 900;
      color: #1B3C6B;
      margin-bottom: 8px;
    }
    .card-logo span { color: #F97316; }
    .card-title {
      font-family: "Poppins", sans-serif;
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
    }
    .card-sub { color: #64748B; font-size: .9rem; margin: 0; }

    /* Champs */
    .field-group { display: flex; flex-direction: column; gap: 16px; margin-bottom: 12px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label {
      font-size: .78rem;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: .06em;
    }
    .field-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .field-wrap input {
      width: 100%;
      padding: 12px 42px 12px 14px;
      border: 1.5px solid #E2E8F0;
      border-radius: 10px;
      background: #fff;
      color: #0f172a;
      font-size: .95rem;
      font-family: inherit;
      outline: none;
      transition: border-color .2s, box-shadow .2s;
    }
    .field-wrap input:focus {
      border-color: #1B3C6B;
      box-shadow: 0 0 0 3px rgba(27,60,107,.08);
    }
    .field-wrap input.has-error { border-color: #EF4444; }
    .field-icon {
      position: absolute;
      right: 13px;
      color: #94A3B8;
      display: flex;
      align-items: center;
      pointer-events: none;
    }
    .field-icon.clickable { pointer-events: all; cursor: pointer; background: none; border: none; padding: 0; }
    .field-error { color: #EF4444; font-size: .78rem; font-weight: 600; }

    .forgot-link {
      display: flex;
      justify-content: flex-end;
      margin: 4px 0 20px;
    }
    .forgot-link a {
      font-size: .82rem;
      font-weight: 700;
      color: #1B3C6B;
      text-decoration: none;
    }
    .forgot-link a:hover { text-decoration: underline; }

    /* Erreur globale */
    .error-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 10px;
      padding: 12px 14px;
      color: #B91C1C;
      font-size: .85rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    /* Bouton submit */
    .btn-submit {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 10px;
      background: #1B3C6B;
      color: #fff;
      font-family: "Poppins", sans-serif;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background .2s, transform .15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-submit:hover:not(:disabled) { background: #132d52; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: .6; cursor: not-allowed; transform: none; }
    .btn-spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Séparateur + inscription */
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 20px 0;
      color: #CBD5E1;
      font-size: .78rem;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1;
      height: 1px; background: #E2E8F0;
    }

    .register-row {
      text-align: center;
      font-size: .88rem;
      color: #64748B;
    }
    .register-row a {
      color: #F97316;
      font-weight: 700;
      text-decoration: none;
    }
    .register-row a:hover { text-decoration: underline; }

    /* Responsive */
    @media (max-width: 900px) {
      .login-left { display: none; }
      .login-right { width: 100%; background: #0f172a; }
      .login-card {
        background: #fff;
        border-radius: 20px;
        padding: 36px 28px;
        box-shadow: 0 20px 60px rgba(0,0,0,.3);
      }
    }
  `],
  template: `
    <div class="login-page">

      <!-- Gauche décoratif -->
      <div class="login-left">
        <div class="left-logo">Bricole<span>Up</span></div>
        <div class="left-tagline">La plateforme des<br>petits travaux<br>en France 🇫🇷</div>
        <p class="left-sub">Trouvez des prestataires de confiance ou proposez vos services. Des milliers de missions vous attendent.</p>
        <div class="left-stats">
          <div class="stat-item">
            <span class="stat-val">12k+</span>
            <span class="stat-label">Utilisateurs actifs</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">4.8★</span>
            <span class="stat-label">Note moyenne</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">98%</span>
            <span class="stat-label">Satisfaction</span>
          </div>
        </div>
      </div>

      <!-- Droite — formulaire -->
      <div class="login-right">
        <div class="login-card">

          <div class="card-header">
            <div class="card-logo">Bricole<span>Up</span></div>
            <h1 class="card-title">Bon retour 👋</h1>
            <p class="card-sub">Connectez-vous à votre compte</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="field-group">

              <div class="field">
                <label>Adresse email</label>
                <div class="field-wrap">
                  <input type="email" formControlName="email" placeholder="vous@exemple.fr"
                    [class.has-error]="form.get('email')?.touched && form.get('email')?.invalid">
                  <span class="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                </div>
                @if (form.get('email')?.touched && form.get('email')?.invalid) {
                  <span class="field-error">Email invalide</span>
                }
              </div>

              <div class="field">
                <label>Mot de passe</label>
                <div class="field-wrap">
                  <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="••••••••"
                    [class.has-error]="form.get('password')?.touched && form.get('password')?.invalid">
                  <button type="button" class="field-icon clickable" (click)="togglePasswordVisibility()">
                    @if (showPassword()) {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    } @else {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                @if (form.get('password')?.touched && form.get('password')?.invalid) {
                  <span class="field-error">Mot de passe requis</span>
                }
              </div>

            </div>

            <div class="forgot-link">
              <a routerLink="/auth/forgot-password">Mot de passe oublié ?</a>
            </div>

            @if (errorMsg()) {
              <div class="error-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {{ errorMsg() }}
              </div>
            }

            <button class="btn-submit" type="submit" [disabled]="form.invalid || loading()">
              @if (loading()) {
                <span class="btn-spinner"></span> Connexion en cours…
              } @else {
                Se connecter →
              }
            </button>
          </form>

          <div class="divider">ou</div>

          <p class="register-row">
            Pas encore de compte ?
            <a routerLink="/auth/register">S'inscrire gratuitement</a>
          </p>

        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  showPassword = signal(false);
  loading = signal(false);
  readonly errorMsg = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notif: NotificationService,
    private router: Router,
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');
    const { email, password } = this.form.value;
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        // Redirection admin hardcodée
        if (res.admin) {
          this.router.navigate(['/admin']);
          return;
        }
        this.notif.showSuccess(`Bienvenue, ${res.user.prenom} !`);
        // Redirection selon le rôle
        const redirect = res.redirect === 'dashboard' ? '/dashboard' : '/annonces';
        this.router.navigate([redirect]);
      },
      error: (err: any) => {
        this.loading.set(false);
        const code = err?.error?.code;
        if (code === 'not_found') {
          // Compte inexistant → redirige vers inscription
          this.notif.showError('Aucun compte trouvé. Redirection vers l\'inscription...');
          setTimeout(() => this.router.navigate(['/auth/register']), 1500);
        } else {
          this.errorMsg.set(err?.error?.error || 'Mot de passe incorrect.');
        }
      },
    });
  }
}
