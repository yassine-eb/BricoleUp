import { Component, OnInit, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .pe-page { min-height: 100vh; background: #F4F7FB; font-family: 'DM Sans', system-ui, sans-serif; padding: 32px 16px; }
    .pe-container { max-width: 720px; margin: 0 auto; }
    .pe-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .pe-avatar-wrap { position: relative; flex-shrink: 0; }
    .pe-avatar { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.12); }
    .pe-avatar-btn { position: absolute; bottom: 0; right: 0; width: 28px; height: 28px; border-radius: 50%; background: #1B3C6B; border: 2px solid #fff; color: #fff; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .pe-header-info h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 1.4rem; color: #0F172A; margin: 0 0 4px; }
    .pe-header-info p { font-size: 0.85rem; color: #64748B; margin: 0; }
    .pe-badge-verif { display: inline-flex; align-items: center; gap: 4px; background: #DCFCE7; color: #16a34a; font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 50px; margin-top: 6px; }
    .pe-tabs { display: flex; gap: 4px; background: #E2E8F0; border-radius: 12px; padding: 4px; margin-bottom: 24px; }
    .pe-tab { flex: 1; padding: 10px; border: none; border-radius: 9px; background: transparent; font: 600 0.88rem 'DM Sans', sans-serif; color: #64748B; cursor: pointer; transition: all 0.2s; }
    .pe-tab.active { background: #fff; color: #1B3C6B; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .pe-card { background: #fff; border-radius: 16px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .pe-card-title { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 0.95rem; color: #0F172A; margin: 0 0 20px; display: flex; align-items: center; gap: 8px; }
    .pe-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .pe-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .pe-field:last-child { margin-bottom: 0; }
    .pe-label { font-size: 0.82rem; font-weight: 600; color: #374151; }
    .pe-input, .pe-select, .pe-textarea { width: 100%; padding: 11px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px; font: 0.92rem 'DM Sans', sans-serif; color: #0F172A; background: #fff; outline: none; box-sizing: border-box; transition: border-color 0.2s; }
    .pe-input:focus, .pe-select:focus, .pe-textarea:focus { border-color: #1B3C6B; }
    .pe-textarea { min-height: 100px; resize: vertical; }
    .pe-skills-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
    .pe-skill-chip { display: flex; align-items: center; gap: 6px; background: #EFF6FF; border: 1px solid #BFDBFE; color: #1B3C6B; padding: 5px 12px; border-radius: 50px; font-size: 0.82rem; font-weight: 600; }
    .pe-skill-chip button { background: none; border: none; cursor: pointer; color: #94A3B8; font-size: 14px; line-height: 1; padding: 0; }
    .pe-skill-chip button:hover { color: #EF4444; }
    .pe-skill-add { display: flex; gap: 8px; }
    .pe-skill-add input { flex: 1; padding: 9px 12px; border: 1.5px solid #E2E8F0; border-radius: 10px; font: 0.88rem 'DM Sans', sans-serif; outline: none; }
    .pe-skill-add input:focus { border-color: #1B3C6B; }
    .pe-skill-add button { padding: 9px 16px; background: #1B3C6B; color: #fff; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .pe-verif-status { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 12px; margin-bottom: 14px; }
    .pe-verif-status.pending  { background: #FFF7ED; border: 1px solid #FED7AA; }
    .pe-verif-status.verified { background: #DCFCE7; border: 1px solid #BBF7D0; }
    .pe-verif-status.none     { background: #F8FAFC; border: 1px solid #E2E8F0; }
    .pe-verif-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .pe-verif-dot.pending  { background: #F97316; }
    .pe-verif-dot.verified { background: #22C55E; }
    .pe-verif-dot.none     { background: #94A3B8; }
    .pe-verif-text { font-size: 0.85rem; color: #374151; }
    .pe-verif-text strong { display: block; font-weight: 700; }
    .pe-upload-zone { border: 2px dashed #CBD5E1; border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: #F8FAFC; }
    .pe-upload-zone:hover { border-color: #1B3C6B; background: #EFF6FF; }
    .pe-upload-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
    .pe-upload-text { font-size: 0.85rem; color: #64748B; }
    .pe-btn-save { width: 100%; padding: 14px; background: #1B3C6B; color: #fff; border: none; border-radius: 12px; font: 700 1rem 'Poppins', sans-serif; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
    .pe-btn-save:hover { background: #132d52; }
    .pe-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .pe-alert { padding: 12px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 500; margin-bottom: 16px; }
    .pe-alert.success { background: #DCFCE7; color: #16a34a; border: 1px solid #BBF7D0; }
    .pe-alert.error   { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
    @media(max-width:768px) {
      .pe-page { padding:16px 14px 80px; }
      .pe-header { flex-direction:column; align-items:flex-start; gap:12px; }
      .pe-tabs { gap:0; overflow-x:auto; }
      .pe-tab { padding:10px 14px; font-size:.82rem; white-space:nowrap; }
      .pe-save-btn { width:100%; }
    }
    @media(max-width:600px) {
      .pe-grid2 { grid-template-columns:1fr; }
    }
  `],
  template: `
    <div class="pe-page">
      <div class="pe-container">

        @if (alert()) {
          <div class="pe-alert" [class.success]="alertType()==='success'" [class.error]="alertType()==='error'">
            {{ alert() }}
          </div>
        }

        <div class="pe-header">
          <div class="pe-avatar-wrap">
            <img [src]="avatarUrl()" class="pe-avatar" alt="avatar">
            <button class="pe-avatar-btn" (click)="fileInput.click()" title="Changer la photo">📷</button>
            <input #fileInput type="file" accept="image/*" style="display:none" (change)="onAvatarChange($event)">
          </div>
          <div class="pe-header-info">
            <h1>{{ prenom() }} {{ nom() }}</h1>
            <p>{{ email() }}</p>
            @if (isVerified()) {
              <span class="pe-badge-verif">✓ Identité vérifiée</span>
            }
          </div>
        </div>

        <div class="pe-tabs">
          <button class="pe-tab" [class.active]="tab()==='infos'" (click)="tab.set('infos')">👤 Informations</button>
          <button class="pe-tab" [class.active]="tab()==='pro'" (click)="tab.set('pro')">💼 Profil Pro</button>
          <button class="pe-tab" [class.active]="tab()==='verif'" (click)="tab.set('verif')">🔐 Vérification</button>
        </div>

        @if (tab() === 'infos') {
          <div class="pe-card">
            <div class="pe-card-title">👤 Informations personnelles</div>
            <div class="pe-grid2">
              <div class="pe-field">
                <label class="pe-label">Prénom</label>
                <input class="pe-input" [ngModel]="prenom()" (ngModelChange)="prenom.set($event)" placeholder="Votre prénom">
              </div>
              <div class="pe-field">
                <label class="pe-label">Nom</label>
                <input class="pe-input" [ngModel]="nom()" (ngModelChange)="nom.set($event)" placeholder="Votre nom">
              </div>
            </div>
            <div class="pe-field">
              <label class="pe-label">Email</label>
              <input class="pe-input" [ngModel]="email()" (ngModelChange)="email.set($event)" type="email">
            </div>
            <div class="pe-field">
              <label class="pe-label">Téléphone</label>
              <input class="pe-input" [ngModel]="phone()" (ngModelChange)="phone.set($event)" type="tel" placeholder="+33 6 xx xx xx xx">
            </div>
            <div class="pe-grid2">
              <div class="pe-field">
                <label class="pe-label">Genre</label>
                <select class="pe-select" [ngModel]="gender()" (ngModelChange)="gender.set($event)">
                  <option value="">Non spécifié</option>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div class="pe-field">
                <label class="pe-label">Statut</label>
                <select class="pe-select" [ngModel]="statut()" (ngModelChange)="statut.set($event)">
                  <option value="particulier">Particulier</option>
                  <option value="entreprise">Entreprise</option>
                </select>
              </div>
            </div>
            @if (statut() === 'entreprise') {
              <div class="pe-grid2">
                <div class="pe-field">
                  <label class="pe-label">Nom commercial</label>
                  <input class="pe-input" [ngModel]="nomCommercial()" (ngModelChange)="nomCommercial.set($event)" placeholder="Ma Société SAS">
                </div>
                <div class="pe-field">
                  <label class="pe-label">SIRET</label>
                  <input class="pe-input" [ngModel]="siret()" (ngModelChange)="siret.set($event)" placeholder="123 456 789 00012">
                </div>
              </div>
            }
          </div>
          <button class="pe-btn-save" [disabled]="saving()" (click)="saveInfos()">
            {{ saving() ? 'Enregistrement...' : '💾 Enregistrer les informations' }}
          </button>
        }

        @if (tab() === 'pro') {
          <div class="pe-card">
            <div class="pe-card-title">📝 Présentation</div>
            <div class="pe-field">
              <label class="pe-label">Bio / Description</label>
              <textarea class="pe-textarea" [ngModel]="bio()" (ngModelChange)="bio.set($event)" placeholder="Décrivez votre activité, vos services, votre expérience..."></textarea>
            </div>
            <div class="pe-grid2">
              <div class="pe-field">
                <label class="pe-label">Tarif horaire (€/h)</label>
                <input class="pe-input" [ngModel]="tarifHoraire()" (ngModelChange)="tarifHoraire.set($event)" type="number" placeholder="Ex: 45">
              </div>
              <div class="pe-field">
                <label class="pe-label">Rayon d'intervention (km)</label>
                <input class="pe-input" [ngModel]="radiusKm()" (ngModelChange)="radiusKm.set($event)" type="number" placeholder="Ex: 30">
              </div>
            </div>
          </div>
          <div class="pe-card">
            <div class="pe-card-title">🛠 Compétences</div>
            <div class="pe-skills-list">
              @for (skill of skills(); track skill) {
                <span class="pe-skill-chip">
                  {{ skill }}
                  <button (click)="removeSkill(skill)">×</button>
                </span>
              }
              @if (skills().length === 0) {
                <span style="font-size:0.85rem;color:#94A3B8">Aucune compétence ajoutée</span>
              }
            </div>
            <div class="pe-skill-add">
              <input [ngModel]="newSkill()" (ngModelChange)="newSkill.set($event)" placeholder="Ex: Plomberie, Électricité..." (keydown.enter)="addSkill()">
              <button (click)="addSkill()">+ Ajouter</button>
            </div>
          </div>
          <button class="pe-btn-save" [disabled]="saving()" (click)="savePro()">
            {{ saving() ? 'Enregistrement...' : '💾 Enregistrer le profil pro' }}
          </button>
        }

        @if (tab() === 'verif') {
          <div class="pe-card">
            <div class="pe-card-title">🔐 Statut de vérification</div>
            <div class="pe-verif-status" [class.verified]="isEmailVerified()" [class.none]="!isEmailVerified()">
              <div class="pe-verif-dot" [class.verified]="isEmailVerified()" [class.none]="!isEmailVerified()"></div>
              <div class="pe-verif-text">
                <strong>Email</strong>
                {{ isEmailVerified() ? 'Vérifié ✓' : 'Non vérifié' }}
              </div>
            </div>
            <div class="pe-verif-status" [class.verified]="isVerified()" [class.pending]="isVerifPending() && !isVerified()" [class.none]="!isVerified() && !isVerifPending()">
              <div class="pe-verif-dot" [class.verified]="isVerified()" [class.pending]="isVerifPending() && !isVerified()" [class.none]="!isVerified() && !isVerifPending()"></div>
              <div class="pe-verif-text">
                <strong>Identité</strong>
                {{ isVerified() ? 'Vérifiée ✓' : isVerifPending() ? 'En cours de vérification...' : 'Non vérifiée' }}
              </div>
            </div>
          </div>
          @if (!isVerified()) {
            <div class="pe-card">
              <div class="pe-card-title">📄 Envoyer un document d'identité</div>
              <p style="font-size:0.85rem;color:#64748B;margin-bottom:16px">
                Envoyez une photo de votre carte d'identité ou passeport pour vérifier votre identité.
              </p>
              <div class="pe-upload-zone" (click)="kycInput.click()">
                <input #kycInput type="file" accept="image/*,.pdf" style="display:none" (change)="onKycChange($event)">
                @if (kycFileName()) {
                  <span class="pe-upload-icon">✅</span>
                  <div class="pe-upload-text">{{ kycFileName() }}</div>
                } @else {
                  <span class="pe-upload-icon">📄</span>
                  <div class="pe-upload-text">Cliquez pour sélectionner un document</div>
                }
              </div>
              @if (kycFile()) {
                <button class="pe-btn-save" [disabled]="saving()" (click)="submitKyc()" style="margin-top:12px">
                  {{ saving() ? 'Envoi...' : '📤 Envoyer pour vérification' }}
                </button>
              }
            </div>
          }
        }

      </div>
    </div>
  `,
})
export class ProfileEditComponent implements OnInit {
  private http   = inject(HttpClient);
  private auth   = inject(AuthService);
  private router = inject(Router);

  tab           = signal<'infos'|'pro'|'verif'>('infos');
  saving        = signal(false);
  alert         = signal('');
  alertType     = signal<'success'|'error'>('success');

  prenom        = signal('');
  nom           = signal('');
  email         = signal('');
  phone         = signal('');
  gender        = signal('');
  statut        = signal('particulier');
  nomCommercial = signal('');
  siret         = signal('');

  bio           = signal('');
  tarifHoraire  = signal<number|null>(null);
  radiusKm      = signal<number|null>(null);
  skills        = signal<string[]>([]);
  newSkill      = signal('');

  isVerified      = signal(false);
  isVerifPending  = signal(false);
  isEmailVerified = signal(false);

  avatarUrl  = signal('https://ui-avatars.com/api/?name=U&background=1B3C6B&color=fff');
  avatarFile = signal<File|null>(null);
  kycFile    = signal<File|null>(null);
  kycFileName = signal('');

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getAccessToken()}` });
  }

  ngOnInit(): void {
    if (!this.auth.getAccessToken()) { this.router.navigate(['/auth/login']); return; }
    this.http.get<any>(`${environment.apiUrl}/auth/users/me/`, { headers: this.headers }).subscribe({
      next: (res) => {
        this.prenom.set(res.prenom || '');
        this.nom.set(res.nom || '');
        this.email.set(res.email || '');
        const p = res.profile || {};
        this.phone.set(p.phone_number || '');
        this.gender.set(p.gender || '');
        this.statut.set(p.statut || 'particulier');
        this.nomCommercial.set(p.nom_commercial || '');
        this.siret.set(p.siret || '');
        this.bio.set(p.bio || '');
        this.radiusKm.set(p.radius || null);
        this.skills.set((p.skills || []).map((s: any) => s.name_fr || s));
        this.isVerified.set(p.is_identity_verified || false);
        this.isVerifPending.set(p.is_identity_verified_request || false);
        this.isEmailVerified.set(p.is_email_verified || false);
        const pic = p.profile_picture_url;
        if (pic && !pic.includes('defaultprofile')) this.avatarUrl.set(pic);
        else this.avatarUrl.set(`https://ui-avatars.com/api/?name=${res.prenom||'U'}+${res.nom||''}&background=1B3C6B&color=fff`);
      },
      error: () => this.router.navigate(['/auth/login']),
    });
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.avatarUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onKycChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.kycFile.set(file);
    this.kycFileName.set(file.name);
  }

  addSkill(): void {
    const v = this.newSkill().trim();
    if (v && !this.skills().includes(v)) this.skills.update(s => [...s, v]);
    this.newSkill.set('');
  }

  removeSkill(skill: string): void {
    this.skills.update(s => s.filter(x => x !== skill));
  }

  saveInfos(): void {
    this.saving.set(true);
    const body: any = {
      prenom: this.prenom(), nom: this.nom(), phone_number: this.phone(),
      gender: this.gender(), statut: this.statut(),
      nom_commercial: this.nomCommercial(), siret: this.siret(),
    };
    const req = this.avatarFile()
      ? (() => { const fd = new FormData(); Object.entries(body).forEach(([k,v]) => v != null && fd.append(k, v as string)); fd.append('profile_picture', this.avatarFile()!); return this.http.patch<any>(`${environment.apiUrl}/auth/users/me/`, fd, { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.getAccessToken()}` }) }); })()
      : this.http.patch<any>(`${environment.apiUrl}/auth/users/me/`, body, { headers: this.headers });
    req.subscribe({
      next: () => { this.saving.set(false); this.showAlert('Informations enregistrées !', 'success'); },
      error: () => { this.saving.set(false); this.showAlert('Erreur lors de la sauvegarde.', 'error'); },
    });
  }

  savePro(): void {
    this.saving.set(true);
    this.http.patch<any>(`${environment.apiUrl}/auth/users/me/`, { bio: this.bio(), radius: this.radiusKm() }, { headers: this.headers }).subscribe({
      next: () => { this.saving.set(false); this.showAlert('Profil pro enregistré !', 'success'); },
      error: () => { this.saving.set(false); this.showAlert('Erreur lors de la sauvegarde.', 'error'); },
    });
  }

  submitKyc(): void {
    const file = this.kycFile();
    if (!file) return;
    this.saving.set(true);
    const fd = new FormData();
    fd.append('document', file);
    this.http.post<any>(`${environment.apiUrl}/auth/users/me/kyc/`, fd, { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.getAccessToken()}` }) }).subscribe({
      next: () => { this.saving.set(false); this.isVerifPending.set(true); this.showAlert('Document envoyé, vérification en cours.', 'success'); },
      error: () => { this.saving.set(false); this.showAlert('Erreur lors de l\'envoi.', 'error'); },
    });
  }

  private showAlert(msg: string, type: 'success'|'error'): void {
    this.alert.set(msg); this.alertType.set(type);
    setTimeout(() => this.alert.set(''), 4000);
  }
}
