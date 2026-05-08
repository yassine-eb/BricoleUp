import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styles: [`
    * { box-sizing: border-box; }
    .fp-page {
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center; padding: 20px;
      background: linear-gradient(135deg, #0f172a 0%, #1B3C6B 100%);
      font-family: "DM Sans", system-ui, sans-serif;
    }
    .fp-card {
      background: #fff; border-radius: 20px; padding: 40px 36px;
      width: 100%; max-width: 440px;
      box-shadow: 0 24px 64px rgba(0,0,0,.3);
    }
    .fp-logo { font-family:"Poppins",sans-serif; font-size:1.4rem; font-weight:900; margin-bottom:28px; }
    .fp-logo .bu { color:#1B3C6B; } .fp-logo .up { color:#F97316; }
    .fp-title { font-family:"Poppins",sans-serif; font-size:1.5rem; font-weight:800; color:#0f172a; margin:0 0 6px; }
    .fp-sub { color:#64748B; font-size:.9rem; margin:0 0 28px; line-height:1.6; }
    .fp-field { margin-bottom: 16px; }
    .fp-label { display:block; font-size:.78rem; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; }
    .fp-input {
      width:100%; border:1.5px solid #E2E8F0; border-radius:12px;
      padding:12px 14px; font-size:.95rem; color:#0f172a; outline:none;
      font-family:inherit; transition:border-color .2s, box-shadow .2s;
    }
    .fp-input:focus { border-color:#1B3C6B; box-shadow:0 0 0 3px rgba(27,60,107,.08); }
    .fp-error { color:#EF4444; font-size:.78rem; font-weight:600; margin-top:4px; }
    .fp-btn {
      width:100%; padding:14px; border:none; border-radius:12px;
      background:#1B3C6B; color:#fff; font-family:"Poppins",sans-serif;
      font-size:1rem; font-weight:700; cursor:pointer; margin-top:8px;
      transition:background .2s, transform .15s;
    }
    .fp-btn:hover:not(:disabled) { background:#132d52; transform:translateY(-1px); }
    .fp-btn:disabled { opacity:.6; cursor:not-allowed; }
    .fp-success { display:flex; flex-direction:column; align-items:center; text-align:center; padding:20px 0; gap:12px; }
    .fp-success-icon { font-size:3.5rem; }
    .fp-success-title { font-family:"Poppins",sans-serif; font-size:1.2rem; font-weight:800; color:#1B3C6B; margin:0; }
    .fp-success-sub { color:#64748B; font-size:.88rem; margin:0; line-height:1.6; }
    .fp-back { display:block; text-align:center; margin-top:20px; color:#1B3C6B; font-weight:700; font-size:.88rem; text-decoration:none; }
    .fp-back:hover { text-decoration:underline; }
    @media(max-width:480px) {
      .fp-card { padding:28px 20px; border-radius:16px; }
    }
  `],
  template: `
    <div class="fp-page">
      <div class="fp-card">
        <div class="fp-logo"><span class="bu">Bricole</span><span class="up">Up</span></div>

        @if (!sent()) {
          <h1 class="fp-title">Mot de passe oublié ?</h1>
          <p class="fp-sub">Entrez votre email pour recevoir un lien de réinitialisation.</p>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="fp-field">
              <label class="fp-label">Adresse email</label>
              <input class="fp-input" type="email" formControlName="email" placeholder="vous@exemple.fr">
              @if (form.get('email')?.touched && form.get('email')?.invalid) {
                <div class="fp-error">Email invalide</div>
              }
            </div>
            <button class="fp-btn" type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Envoi en cours…' : 'Envoyer le lien →' }}
            </button>
          </form>
        } @else {
          <div class="fp-success">
            <div class="fp-success-icon">📧</div>
            <h2 class="fp-success-title">Email envoyé !</h2>
            <p class="fp-success-sub">Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.</p>
          </div>
        }

        <a routerLink="/auth/login" class="fp-back">← Retour à la connexion</a>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  loading = signal(false);
  sent    = signal(false);
  form    = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  constructor(private fb: FormBuilder, private api: ApiService) {}

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.api.post('auth/password-reset/', this.form.value).subscribe({
      next:  () => { this.loading.set(false); this.sent.set(true); },
      error: () => this.loading.set(false),
    });
  }
}
