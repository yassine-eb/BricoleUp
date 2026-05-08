import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  styles: [`
    * { box-sizing: border-box; }
    .reg-page {
      min-height: 100vh; display: flex;
      background: linear-gradient(135deg, #0f172a 0%, #1B3C6B 100%);
      font-family: "DM Sans", system-ui, sans-serif;
    }
    /* Panel décoratif gauche - desktop only */
    .reg-left {
      flex: 1; display: flex; flex-direction: column;
      justify-content: center; padding: 60px;
      background: linear-gradient(135deg, #132d52 0%, #1B3C6B 60%, #1e4a82 100%);
      position: relative; overflow: hidden;
    }
    .reg-left::before {
      content:''; position:absolute; width:500px; height:500px; border-radius:50%;
      background:rgba(249,115,22,.08); top:-150px; right:-150px;
    }
    .reg-left-logo { font-family:"Poppins",sans-serif; font-size:2rem; font-weight:900; color:#fff; margin-bottom:40px; position:relative; z-index:1; }
    .reg-left-logo span { color:#F97316; }
    .reg-left-title { font-family:"Poppins",sans-serif; font-size:2rem; font-weight:800; color:#fff; line-height:1.25; margin-bottom:16px; position:relative; z-index:1; }
    .reg-left-sub { color:rgba(255,255,255,.65); font-size:.95rem; line-height:1.7; max-width:380px; position:relative; z-index:1; }

    /* Panel droit */
    .reg-right {
      width: 520px; flex-shrink: 0; display: flex; align-items: center;
      justify-content: center; background: #f8fafc; padding: 32px;
      overflow-y: auto;
    }
    .reg-card { width: 100%; max-width: 440px; }
    .reg-logo { font-family:"Poppins",sans-serif; font-size:1.3rem; font-weight:900; margin-bottom:8px; }
    .reg-logo .bu { color:#1B3C6B; } .reg-logo .up { color:#F97316; }
    .reg-title { font-family:"Poppins",sans-serif; font-size:1.5rem; font-weight:800; color:#0f172a; margin:0 0 4px; }
    .reg-sub { color:#64748B; font-size:.88rem; margin:0 0 24px; }

    /* Stepper */
    .reg-stepper { display:flex; align-items:center; gap:0; margin-bottom:28px; }
    .reg-step-item { display:flex; align-items:center; flex:1; }
    .reg-step-circle {
      width:32px; height:32px; border-radius:50%; display:flex; align-items:center;
      justify-content:center; font-weight:800; font-size:.82rem; flex-shrink:0;
      background:#E2E8F0; color:#64748B; transition:all .2s;
    }
    .reg-step-circle.done { background:#22C55E; color:#fff; }
    .reg-step-circle.active { background:#1B3C6B; color:#fff; }
    .reg-step-line { flex:1; height:2px; background:#E2E8F0; margin:0 4px; }
    .reg-step-line.done { background:#22C55E; }
    .reg-step-label { display:none; }

    /* Champs */
    .reg-field { margin-bottom:14px; }
    .reg-label { display:block; font-size:.75rem; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:.06em; margin-bottom:5px; }
    .reg-input, .reg-textarea {
      width:100%; border:1.5px solid #E2E8F0; border-radius:10px;
      padding:11px 13px; font-size:.9rem; color:#0f172a; outline:none;
      font-family:inherit; transition:border-color .2s, box-shadow .2s;
      background:#fff;
    }
    .reg-input:focus, .reg-textarea:focus { border-color:#1B3C6B; box-shadow:0 0 0 3px rgba(27,60,107,.08); }
    .reg-textarea { min-height:80px; resize:none; line-height:1.6; }
    .reg-error { color:#EF4444; font-size:.75rem; font-weight:600; margin-top:3px; }
    .reg-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

    /* Rôle cards */
    .reg-role-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
    .reg-role-card {
      border:2px solid #E2E8F0; border-radius:14px; padding:18px 14px;
      cursor:pointer; text-align:center; transition:all .15s; background:#fff;
    }
    .reg-role-card.selected { border-color:#1B3C6B; background:#EFF6FF; }
    .reg-role-icon { font-size:2rem; margin-bottom:8px; }
    .reg-role-title { font-family:"Poppins",sans-serif; font-weight:700; font-size:.9rem; color:#0f172a; }
    .reg-role-sub { font-size:.75rem; color:#64748B; margin-top:4px; line-height:1.4; }

    /* Compétences */
    .reg-chips-wrap { border:1.5px solid #E2E8F0; border-radius:10px; padding:10px; min-height:46px; display:flex; flex-wrap:wrap; gap:6px; align-items:center; background:#fff; }
    .reg-chip { background:#EFF6FF; color:#1B3C6B; border-radius:50px; padding:3px 10px; font-size:.78rem; font-weight:700; display:flex; align-items:center; gap:4px; }
    .reg-chip button { border:none; background:transparent; color:#1B3C6B; font-size:1rem; cursor:pointer; padding:0; line-height:1; }
    .reg-chip-input { border:none; outline:none; font-family:inherit; font-size:.85rem; flex:1; min-width:120px; }

    /* Boutons */
    .reg-btn-row { display:flex; justify-content:space-between; gap:10px; margin-top:20px; }
    .reg-btn-primary {
      flex:1; padding:13px; border:none; border-radius:10px;
      background:#1B3C6B; color:#fff; font-family:"Poppins",sans-serif;
      font-size:.95rem; font-weight:700; cursor:pointer; transition:background .2s;
    }
    .reg-btn-primary:hover:not(:disabled) { background:#132d52; }
    .reg-btn-primary:disabled { opacity:.6; cursor:not-allowed; }
    .reg-btn-ghost { padding:13px 20px; border:1.5px solid #E2E8F0; border-radius:10px; background:#fff; color:#64748B; font-weight:700; cursor:pointer; font-family:inherit; }
    .reg-btn-ghost:hover { border-color:#1B3C6B; color:#1B3C6B; }

    .reg-login-row { text-align:center; font-size:.88rem; color:#64748B; margin-top:20px; }
    .reg-login-row a { color:#F97316; font-weight:700; text-decoration:none; }
    .reg-login-row a:hover { text-decoration:underline; }

    .reg-error-box { background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; padding:11px 14px; color:#B91C1C; font-size:.85rem; font-weight:600; margin-bottom:14px; display:flex; gap:8px; align-items:center; }

    .reg-success { display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; padding:20px 0; }
    .reg-success-icon { font-size:3.5rem; }

    @media(max-width:900px) { .reg-left { display:none; } .reg-right { width:100%; background:#0f172a; } .reg-card { background:#fff; border-radius:20px; padding:32px 24px; box-shadow:0 20px 60px rgba(0,0,0,.3); } }
    @media(max-width:480px) { .reg-row, .reg-role-grid { grid-template-columns:1fr; } .reg-card { padding:24px 16px; } }
  `],
  template: `
    <div class="reg-page">
      <!-- Gauche déco (desktop) -->
      <div class="reg-left">
        <div class="reg-left-logo">Bricole<span>Up</span></div>
        <div class="reg-left-title">Rejoignez la communauté<br>BricoleUp 🇫🇷</div>
        <p class="reg-left-sub">Trouvez des prestataires de confiance ou proposez vos services. Plus de 12 000 utilisateurs actifs.</p>
      </div>

      <!-- Droite formulaire -->
      <div class="reg-right">
        <div class="reg-card">
          <div class="reg-logo"><span class="bu">Bricole</span><span class="up">Up</span></div>
          <h1 class="reg-title">Créer un compte</h1>
          <p class="reg-sub">Rejoignez la marketplace BricoleUp</p>

          <!-- Stepper -->
          <div class="reg-stepper">
            <div class="reg-step-item">
              <div class="reg-step-circle" [class.active]="step===1" [class.done]="step>1">{{ step > 1 ? '✓' : '1' }}</div>
            </div>
            <div class="reg-step-line" [class.done]="step>1"></div>
            <div class="reg-step-item">
              <div class="reg-step-circle" [class.active]="step===2" [class.done]="step>2">{{ step > 2 ? '✓' : '2' }}</div>
            </div>
            <div class="reg-step-line" [class.done]="step>2"></div>
            <div class="reg-step-item">
              <div class="reg-step-circle" [class.active]="step===3">3</div>
            </div>
          </div>

          @if (errorMsg()) {
            <div class="reg-error-box">⚠️ {{ errorMsg() }}</div>
          }

          <!-- Étape 1 : Infos -->
          @if (step === 1) {
            <form [formGroup]="step1Form" (ngSubmit)="nextStep()">
              <div class="reg-row">
                <div class="reg-field">
                  <label class="reg-label">Prénom</label>
                  <input class="reg-input" formControlName="prenom" placeholder="Jean">
                  @if (step1Form.get('prenom')?.touched && step1Form.get('prenom')?.invalid) { <div class="reg-error">Requis</div> }
                </div>
                <div class="reg-field">
                  <label class="reg-label">Nom</label>
                  <input class="reg-input" formControlName="nom" placeholder="Dupont">
                  @if (step1Form.get('nom')?.touched && step1Form.get('nom')?.invalid) { <div class="reg-error">Requis</div> }
                </div>
              </div>
              <div class="reg-field">
                <label class="reg-label">Email</label>
                <input class="reg-input" type="email" formControlName="email" placeholder="vous@exemple.fr">
                @if (step1Form.get('email')?.touched && step1Form.get('email')?.invalid) { <div class="reg-error">Email invalide</div> }
              </div>
              <div class="reg-field">
                <label class="reg-label">Mot de passe</label>
                <input class="reg-input" type="password" formControlName="password" placeholder="8 caractères minimum">
                @if (step1Form.get('password')?.touched && step1Form.get('password')?.invalid) { <div class="reg-error">Minimum 8 caractères</div> }
              </div>
              <div class="reg-field">
                <label class="reg-label">Confirmer le mot de passe</label>
                <input class="reg-input" type="password" formControlName="password2" placeholder="Répétez le mot de passe">
                @if (step1Form.get('password2')?.touched && step1Form.hasError('passwordMismatch')) { <div class="reg-error">Les mots de passe ne correspondent pas</div> }
              </div>
              <div class="reg-btn-row" style="justify-content:flex-end">
                <button class="reg-btn-primary" type="submit" [disabled]="step1Form.invalid">Suivant →</button>
              </div>
            </form>
          }

          <!-- Étape 2 : Rôle -->
          @if (step === 2) {
            <p style="color:#64748B;font-size:.88rem;margin:0 0 16px">Vous souhaitez :</p>
            <div class="reg-role-grid">
              <div class="reg-role-card" [class.selected]="role==='client'" (click)="role='client'">
                <div class="reg-role-icon">🏠</div>
                <div class="reg-role-title">Je suis client</div>
                <div class="reg-role-sub">Je cherche des prestataires</div>
              </div>
              <div class="reg-role-card" [class.selected]="role==='prestataire'" (click)="role='prestataire'">
                <div class="reg-role-icon">🔧</div>
                <div class="reg-role-title">Je suis prestataire</div>
                <div class="reg-role-sub">Je propose mes services</div>
              </div>
            </div>
            <div class="reg-btn-row">
              <button class="reg-btn-ghost" type="button" (click)="step=1">← Retour</button>
              <button class="reg-btn-primary" type="button" (click)="nextStep()">Suivant →</button>
            </div>
          }

          <!-- Étape 3 : Profil pro / finalisation -->
          @if (step === 3) {
            @if (role === 'prestataire') {
              <div class="reg-row">
                <div class="reg-field">
                  <label class="reg-label">Tarif horaire (€)</label>
                  <input class="reg-input" type="number" [(ngModel)]="tarif" placeholder="45">
                </div>
                <div class="reg-field">
                  <label class="reg-label">Rayon (km)</label>
                  <input class="reg-input" type="number" [(ngModel)]="rayon" placeholder="20">
                </div>
              </div>
              <div class="reg-field">
                <label class="reg-label">Bio / Présentation</label>
                <textarea class="reg-textarea" [(ngModel)]="bio" placeholder="Décrivez votre expérience…"></textarea>
              </div>
              <div class="reg-field">
                <label class="reg-label">Compétences</label>
                <div class="reg-chips-wrap">
                  @for (c of competences(); track c) {
                    <span class="reg-chip">{{ c }} <button type="button" (click)="removeComp(c)">×</button></span>
                  }
                  <input class="reg-chip-input" placeholder="Plomberie, Électricité…" (keydown.enter)="addComp($event)">
                </div>
              </div>
            } @else {
              <div style="text-align:center;padding:20px 0">
                <div style="font-size:3rem;margin-bottom:12px">✅</div>
                <p style="font-family:Poppins,sans-serif;font-weight:700;color:#1B3C6B;margin:0 0 6px">Profil Client</p>
                <p style="color:#64748B;font-size:.85rem;margin:0">Vous pourrez poster des annonces et contacter des prestataires.</p>
              </div>
            }
            <div class="reg-btn-row">
              <button class="reg-btn-ghost" type="button" (click)="step=2">← Retour</button>
              <button class="reg-btn-primary" type="button" (click)="onSubmit()" [disabled]="loading()">
                {{ loading() ? 'Création…' : 'Créer mon compte' }}
              </button>
            </div>
          }

          <p class="reg-login-row">Déjà un compte ? <a routerLink="/auth/login">Se connecter</a></p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  loading    = signal(false);
  errorMsg   = signal('');
  step       = 1;
  role       = 'client';
  tarif: number | null = null;
  rayon      = 20;
  bio        = '';
  competences = signal<string[]>([]);

  step1Form = this.fb.group({
    prenom:    ['', Validators.required],
    nom:       ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8)]],
    password2: ['', Validators.required],
  }, { validators: this.passwordMatch });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  nextStep(): void {
    if (this.step === 1) {
      this.step1Form.markAllAsTouched();
      if (this.step1Form.valid) this.step = 2;
    } else if (this.step === 2) {
      this.step = 3;
    }
  }

  addComp(e: Event): void {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const v = input.value.trim();
    if (v && !this.competences().includes(v)) this.competences.update(l => [...l, v]);
    input.value = '';
  }

  removeComp(c: string): void { this.competences.update(l => l.filter(x => x !== c)); }

  onSubmit(): void {
    this.loading.set(true);
    this.errorMsg.set('');
    const { prenom, nom, email, password, password2 } = this.step1Form.value;
    const payload: any = { prenom, nom, email, password, password2, role: this.role };
    if (this.role === 'prestataire') {
      payload.profile = { tarif_horaire: this.tarif, rayon_km: this.rayon, bio: this.bio, competences: this.competences() };
    }
    this.auth.register(payload).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.router.navigate([this.role === 'prestataire' ? '/dashboard' : '/annonces']);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.error || err?.error?.email?.[0] || 'Erreur lors de l\'inscription.');
      },
    });
  }

  private passwordMatch(c: AbstractControl) {
    return c.get('password')?.value === c.get('password2')?.value ? null : { passwordMismatch: true };
  }
}
