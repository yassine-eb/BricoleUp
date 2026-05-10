import { Component, AfterViewInit, ViewEncapsulation, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UpperCasePipe, SlicePipe, NgFor, NgIf, DatePipe, CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';
import { HomeResponse } from '../../core/models/home.model';
import { Annonce } from '../../core/models/ad.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class LandingComponent implements OnInit, AfterViewInit {

  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private api = inject(ApiService);

  latestAnnonce: Annonce | null = null;
  latestDemandes: any[] = [];
  latestOffres: any[] = [];

  ngOnInit(): void {
    this.api.get<HomeResponse>('v1/home/', { country: 'FR' }).subscribe({
      next: (data) => {
        this.latestAnnonce = data.latest_annonce ?? null;
        this.latestDemandes = data.latest_demandes?.slice(0, 3) ?? [];
        this.latestOffres = data.latest_offres?.slice(0, 3) ?? [];
        setTimeout(() => this.renderCards(), 0);
      },
      error: () => {},
    });
  }

  private renderCards(): void {
    const avatarColors = ['blue', 'green', 'orange'];
    const baseUrl = 'http://localhost:8000';

    const avatar = (profile: any, username: string, color: string) => {
      const pic = profile?.profile_picture_url;
      const url = pic && !pic.includes('defaultprofile') ? (pic.startsWith('http') ? pic : baseUrl + pic) : null;
      if (url) return `<img src="${url}" class="avatar-img" alt="${username}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`;
      return `<span class="avatar ${color}">${username.slice(0, 2).toUpperCase()}</span>`;
    };

    const annonceImg = (d: any) => {
      const img = d.image1 || d.image2 || d.image3;
      if (img) return `<img src="${img}" alt="Photo annonce" style="width:100%;height:160px;object-fit:cover;border-radius:12px 12px 0 0;">`;
      return `<div class="placeholder" style="height:160px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:#f1f5f9;">🔧</div>`;
    };

    // === DEMANDES ===
    const demandesGrid = document.querySelector('.requests .cards-grid');
    if (demandesGrid && this.latestDemandes.length) {
      demandesGrid.innerHTML = this.latestDemandes.map((d: any, i: number) => {
        const username = d.created_by?.username || 'Utilisateur';
        const profile = d.created_by?.profile;
        const city = d.city?.name_fr || '';
        const skill = d.skills?.[0]?.name_fr || d.category?.name_fr || 'Prestation';
        const color = avatarColors[i % avatarColors.length];
        const desc = (d.description || '').replace(/\r\n/g, ' ').slice(0, 120) + '…';
        const msgs = d.messages_sent || 0;
        return `
          <article class="card reveal is-visible" style="transition-delay:${i * 100}ms">
            ${annonceImg(d)}
            <div class="card-body">
              <div class="card-header">
                ${avatar(profile, username, color)}
                <div>
                  <div class="name">${username}</div>
                  <div class="city">${city}</div>
                </div>
              </div>
              <div class="request-title">${skill}</div>
              <p class="description">${desc}</p>
              <span class="response-badge">${msgs} réponse${msgs !== 1 ? 's' : ''}</span>
            </div>
          </article>`;
      }).join('');
    }

    // === PRESTATAIRES (offres) ===
    const offresGrid = document.querySelector('.providers .cards-grid');
    if (offresGrid && this.latestOffres.length) {
      offresGrid.innerHTML = this.latestOffres.map((o: any, i: number) => {
        const username = o.created_by?.username || 'Prestataire';
        const profile = o.created_by?.profile;
        const city = o.city?.name_fr || '';
        const color = avatarColors[i % avatarColors.length];
        const desc = (o.description || '').replace(/\r\n/g, ' ').slice(0, 130) + '…';
        const statut = profile?.statut === 'entreprise' ? 'Entreprise' : 'Auto-entrepreneur';
        return `
          <article class="card reveal is-visible" style="transition-delay:${i * 100}ms">
            ${annonceImg(o)}
            <div class="card-body">
              <div class="card-header">
                ${avatar(profile, username, color)}
                <div>
                  <div class="name">${username}</div>
                  <div class="provider-meta">
                    <span class="role-badge pro">${statut}</span>
                  </div>
                  <div class="city">${city}</div>
                </div>
              </div>
              <p class="description three">${desc}</p>
            </div>
          </article>`;
      }).join('');
    }
  }

  ngAfterViewInit(): void {
    const navbar = document.getElementById('navbar');
    let modalActif: string | null = null;

    // ===== CHARGER LES VILLES =====
    let citiesData: any[] = [];
    this.http.get<any>(`${environment.apiUrl}/catalog/cities/`).subscribe({
      next: (res) => {
        citiesData = res.results || res;
        const inputs = ['d-city', 'e-city', 'f-city'];
        inputs.forEach(id => {
          const datalist = document.getElementById(`${id}-list`) as HTMLDataListElement;
          if (!datalist) return;
          citiesData.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name + (c.country?.name ? ` (${c.country.name})` : '');
            datalist.appendChild(opt);
          });
        });
      },
    });

    const resolveCityId = (inputId: string): string | undefined => {
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (!input || !input.value.trim()) return undefined;
      const typed = input.value.trim().toLowerCase();
      const match = citiesData.find(c => {
        const label = (c.name + (c.country?.name ? ` (${c.country.name})` : '')).toLowerCase();
        return label === typed || c.name.toLowerCase() === typed;
      });
      return match ? String(match.id) : undefined;
    };

    // ===== SCROLL =====
    window.addEventListener('scroll', () => {
      if (!navbar) return;
      navbar.style.boxShadow = window.scrollY > 10
        ? '0 4px 20px rgba(27,60,107,0.12)'
        : '0 2px 8px rgba(0,0,0,0.08)';
    });

    // ===== REVEAL =====
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    // ===== MODALS =====
    const ouvrirModal = (id: string) => {
      document.querySelectorAll('.modal').forEach((m) => m.classList.remove('actif'));
      document.getElementById(id)?.classList.add('actif');
      document.getElementById('overlay')?.classList.add('actif');
      document.body.style.overflow = 'hidden';
      modalActif = id;
    };

    const fermerModal = () => {
      document.querySelectorAll('.modal').forEach((m) => m.classList.remove('actif'));
      document.getElementById('overlay')?.classList.remove('actif');
      document.body.style.overflow = '';
      modalActif = null;
    };

    // Toast notification instantané
    const showToast = (msg: string, type: 'success'|'error' = 'success') => {
      const t = document.createElement('div');
      t.style.cssText = `
        position:fixed;top:20px;left:50%;transform:translateX(-50%);
        background:${type==='success'?'#22C55E':'#EF4444'};color:#fff;
        padding:12px 24px;border-radius:50px;font-weight:700;font-size:.88rem;
        font-family:"DM Sans",sans-serif;z-index:99999;
        box-shadow:0 4px 20px rgba(0,0,0,.2);
        animation:toastIn .25s ease;
      `;
      t.textContent = (type==='success'?'✓ ':'✕ ') + msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3500);
    };

    const showError = (id: string, msg: string) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.cssText = 'background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:10px 14px;color:#B91C1C;font-size:.84rem;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px;';
      }
      el.innerHTML = '⚠️ ' + msg;
      const modal = document.querySelector('.modal.actif');
      const form = modal?.querySelector('form');
      if (form && !document.getElementById(id)) form.prepend(el);
    };

    const clearError = (id: string) => document.getElementById(id)?.remove();

    // Bouton avec état de chargement instantané
    const setBtnLoading = (btn: HTMLButtonElement, loading: boolean, text: string) => {
      btn.disabled = loading;
      btn.style.opacity = loading ? '0.7' : '1';
      btn.textContent = loading ? '⏳ ' + text + '…' : text;
    };

    // Helper fetch AJAX pur
    const ajaxPost = async (url: string, data: any): Promise<any> => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw json;
      return json;
    };

    document.querySelectorAll('.js-open-register').forEach((t) =>
      t.addEventListener('click', (e) => { e.preventDefault(); ouvrirModal('modal-a'); })
    );
    document.querySelectorAll('.js-open-login').forEach((t) =>
      t.addEventListener('click', (e) => { e.preventDefault(); ouvrirModal('modal-b'); })
    );
    document.querySelectorAll('[data-open]').forEach((t) =>
      t.addEventListener('click', () => ouvrirModal((t as HTMLElement).dataset['open']!))
    );
    document.querySelectorAll('[data-back]').forEach((t) =>
      t.addEventListener('click', () => ouvrirModal((t as HTMLElement).dataset['back']!))
    );
    document.querySelectorAll('.modal-close').forEach((btn) =>
      btn.addEventListener('click', fermerModal)
    );
    document.getElementById('overlay')?.addEventListener('click', fermerModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalActif) fermerModal();
    });

    // ===== TOGGLE PASSWORD =====
    document.querySelectorAll('.toggle-password').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = (btn.parentElement as HTMLElement).querySelector('input') as HTMLInputElement;
        if (input) input.type = input.type === 'password' ? 'text' : 'password';
      });
    });

    // ===== CONNEXION (modal-b) =====
    const formLogin = document.querySelector('#form-login') as HTMLFormElement;
    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError('login-error');
        const email    = (document.getElementById('login-email') as HTMLInputElement)?.value.trim();
        const password = (document.getElementById('login-password') as HTMLInputElement)?.value;
        const btn      = formLogin.querySelector('.modal-submit') as HTMLButtonElement;
        setBtnLoading(btn, true, 'Connexion');
        try {
          const res = await ajaxPost(`${environment.apiUrl}/v1/auth/login/`, { email, password });
          this.auth.setTokens(res.access, res.refresh);
          setBtnLoading(btn, false, 'Connexion');
          showToast('Bienvenue ! Connexion réussie 👋');
          fermerModal();
          setTimeout(() => {
            if (res.admin) { this.router.navigate(['/admin']); return; }
            this.router.navigate([res.redirect === 'dashboard' ? '/dashboard' : '/annonces']);
          }, 600);
        } catch (err: any) {
          setBtnLoading(btn, false, 'Connexion');
          const code = err?.code;
          if (code === 'not_found') {
            showError('login-error', 'Aucun compte trouvé avec cet email.');
            setTimeout(() => { fermerModal(); ouvrirModal('modal-a'); }, 1800);
          } else {
            showError('login-error', err?.error || 'Email ou mot de passe incorrect.');
          }
        }
      });
    }

    // Helper : lire un champ par name dans un formulaire
    const val = (form: HTMLFormElement, name: string): string => {
      const el = form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      return el ? el.value.trim() : '';
    };

    // Helper : mettre à jour le profil après inscription
    const updateProfile = (token: string, profileData: any) => {
      if (Object.values(profileData).every(v => !v)) return;
      this.http.patch(
        `${environment.apiUrl}/profiles/me/update/`,
        profileData,
        { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      ).subscribe();
    };

    (window as any).ouvrirModalPublic = (id: string) => ouvrirModal(id);

    // ===== ORIGINE (particulier ou entreprise) =====
    let origine = 'particulier';
    (window as any).setOrigin = (o: string) => { origine = o; ouvrirModal('modal-g'); };
    (window as any).choixClient = () => {
      const titre = document.getElementById('modal-d-title');
      if (titre) titre.innerHTML = origine === 'entreprise'
        ? 'Inscription <span style="color:#F97316">Entreprise</span>'
        : 'Inscription <span style="color:#F97316">Particulier</span>';

      // Champs prénom/nom → nom commercial si entreprise
      const prenomLabel = document.querySelector('label[for="d-prenom"]');
      const nomField    = document.getElementById('d-nom')?.closest('.field') as HTMLElement;
      const inputRow    = document.getElementById('d-prenom')?.closest('.input-row') as HTMLElement;
      const prenomInput = document.getElementById('d-prenom') as HTMLInputElement;
      const genderField = document.getElementById('d-gender')?.closest('.field') as HTMLElement;
      if (origine === 'entreprise') {
        if (prenomLabel) prenomLabel.textContent = 'Nom commercial';
        if (prenomInput) prenomInput.placeholder = ' ';
        if (nomField) nomField.style.display = 'none';
        if (inputRow) inputRow.style.gridTemplateColumns = '1fr';
        if (genderField) genderField.style.display = 'none';
      } else {
        if (prenomLabel) prenomLabel.textContent = 'Prénom';
        if (nomField) nomField.style.display = '';
        if (inputRow) inputRow.style.gridTemplateColumns = '';
        if (genderField) genderField.style.display = '';
      }
      ouvrirModal('modal-d');
    };
    (window as any).choixPrestataire = () => ouvrirModal(origine === 'entreprise' ? 'modal-f' : 'modal-e');

    // ===== STEPPER MODAL-D PARTICULIER =====
    (window as any).dNextStep = () => {
      const prenom = (document.getElementById('d-prenom') as HTMLInputElement)?.value?.trim();
      const email  = (document.getElementById('d-email') as HTMLInputElement)?.value?.trim();
      const pwd    = (document.getElementById('d-password') as HTMLInputElement)?.value;
      if (!prenom || !email || !pwd) {
        showToast('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
      }
      document.getElementById('d-step-1')!.style.display = 'none';
      document.getElementById('d-step-2')!.style.display = 'grid';
      document.getElementById('d-step-text')!.textContent = 'Étape 2/2 — Informations';
      document.getElementById('d-rsm-1')!.classList.remove('active');
      document.getElementById('d-rsm-1')!.classList.add('done');
      document.getElementById('d-rsm-1')!.textContent = '✓';
      document.getElementById('d-rsm-2')!.classList.add('active');
    };
    (window as any).dPrevStep = () => {
      document.getElementById('d-step-2')!.style.display = 'none';
      document.getElementById('d-step-1')!.style.display = 'grid';
      document.getElementById('d-step-text')!.textContent = 'Étape 1/2 — Identité';
      document.getElementById('d-rsm-2')!.classList.remove('active');
      document.getElementById('d-rsm-1')!.classList.add('active');
      document.getElementById('d-rsm-1')!.classList.remove('done');
      document.getElementById('d-rsm-1')!.textContent = '1';
      document.getElementById('modal-d')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ===== STEPPER MODAL-E AUTO-ENTREPRENEUR =====
    (window as any).eNextStep = () => {
      const prenom = (document.getElementById('e-prenom') as HTMLInputElement)?.value?.trim();
      const email  = (document.getElementById('e-email') as HTMLInputElement)?.value?.trim();
      const pwd    = (document.getElementById('e-password') as HTMLInputElement)?.value;
      if (!prenom || !email || !pwd) {
        showToast('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
      }
      document.getElementById('e-step-1')!.style.display = 'none';
      document.getElementById('e-step-2')!.style.display = 'grid';
      document.getElementById('e-step-text')!.textContent = 'Étape 2/2 — Activité';
      document.getElementById('e-rsm-1')!.classList.remove('active');
      document.getElementById('e-rsm-1')!.classList.add('done');
      document.getElementById('e-rsm-1')!.textContent = '✓';
      document.getElementById('e-rsm-2')!.classList.add('active');
    };
    (window as any).ePrevStep = () => {
      document.getElementById('e-step-2')!.style.display = 'none';
      document.getElementById('e-step-1')!.style.display = 'grid';
      document.getElementById('e-step-text')!.textContent = 'Étape 1/2 — Identité';
      document.getElementById('e-rsm-2')!.classList.remove('active');
      document.getElementById('e-rsm-1')!.classList.add('active');
      document.getElementById('e-rsm-1')!.classList.remove('done');
      document.getElementById('e-rsm-1')!.textContent = '1';
      document.getElementById('modal-e')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ===== STEPPER MODAL-F ENTREPRISE =====
    (window as any).fNextStep = () => {
      const prenom = (document.getElementById('f-nom-commercial') as HTMLInputElement)?.value?.trim();
      const email  = (document.getElementById('f-email') as HTMLInputElement)?.value?.trim();
      const pwd    = (document.getElementById('f-password') as HTMLInputElement)?.value;
      if (!prenom || !email || !pwd) {
        showToast('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
      }
      document.getElementById('f-step-1')!.style.display = 'none';
      document.getElementById('f-step-2')!.style.display = 'grid';
      document.getElementById('f-step-text')!.textContent = 'Étape 2/2 — Entreprise';
      document.getElementById('f-rsm-1')!.classList.remove('active');
      document.getElementById('f-rsm-1')!.classList.add('done');
      document.getElementById('f-rsm-1')!.textContent = '✓';
      document.getElementById('f-rsm-2')!.classList.add('active');
    };
    (window as any).fPrevStep = () => {
      document.getElementById('f-step-2')!.style.display = 'none';
      document.getElementById('f-step-1')!.style.display = 'grid';
      document.getElementById('f-step-text')!.textContent = 'Étape 1/2 — Identité';
      document.getElementById('f-rsm-2')!.classList.remove('active');
      document.getElementById('f-rsm-1')!.classList.add('active');
      document.getElementById('f-rsm-1')!.classList.remove('done');
      document.getElementById('f-rsm-1')!.textContent = '1';
      document.getElementById('modal-f')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper inscription générique avec fetch
    const registerForm = async (
      form: HTMLFormElement, errorId: string, role: string,
      cityInputId: string, redirect: string, extraFields: string[] = []
    ) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError(errorId);
        const btn = form.querySelector('.modal-submit') as HTMLButtonElement;
        setBtnLoading(btn, true, 'M\'inscrire');

        const prenom   = val(form, 'prenom');
        const nom      = val(form, 'nom');
        // Username auto-généré depuis prénom.nom + 4 chiffres aléatoires
        const autoUsername = val(form, 'username') ||
          (prenom + '.' + nom).toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9.]/g, '') + Math.floor(1000 + Math.random() * 9000);
        const payload: any = {
          prenom,
          nom,
          email:    val(form, 'email'),
          username: autoUsername,
          password: val(form, 'password'),
          password2: val(form, 'password'),
          role,
        };

        try {
          const res = await ajaxPost(`${environment.apiUrl}/v1/auth/register/`, payload);
          this.auth.setTokens(res.access, res.refresh);

          // Infos profil complémentaires en arrière-plan (non bloquant)
          const profileData: any = {};
          const phone = val(form, 'phone_number');
          if (phone) profileData.phone_number = phone;
          const cityId = resolveCityId(cityInputId);
          if (cityId) profileData.city = cityId;
          extraFields.forEach(f => { const v = val(form, f); if (v) profileData[f] = v; });
          if (Object.keys(profileData).length) {
            fetch(`${environment.apiUrl}/profil/edit/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${res.access}` },
              body: JSON.stringify(profileData),
            }).catch(() => {});
          }

          setBtnLoading(btn, false, 'M\'inscrire');
          showToast('Compte créé avec succès ! Bienvenue 🎉');
          fermerModal();
          setTimeout(() => this.router.navigate([redirect]), 700);
        } catch (err: any) {
          setBtnLoading(btn, false, 'M\'inscrire');
          const msg = err?.email?.[0] || err?.password?.[0] || err?.username?.[0] || err?.error || 'Erreur lors de l\'inscription.';
          showError(errorId, msg);
        }
      });
    };

    // ===== INSCRIPTION PARTICULIER/ENTREPRISE CLIENT (modal-d) =====
    const formParticulier = document.querySelector('#form-particulier') as HTMLFormElement;
    if (formParticulier) formParticulier.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError('reg-part-error');
      const btn = formParticulier.querySelector('.modal-submit') as HTMLButtonElement;
      setBtnLoading(btn, true, 'M\'inscrire');
      const prenom = val(formParticulier, 'prenom');
      const nom    = val(formParticulier, 'nom');
      const autoUsername = (prenom + '.' + nom).toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.]/g, '')
        + Math.floor(1000 + Math.random() * 9000);
      const payload: any = {
        prenom, nom,
        email:    val(formParticulier, 'email'),
        username: autoUsername,
        password: val(formParticulier, 'password'),
        password2: val(formParticulier, 'password'),
        role: 'client',
      };
      try {
        const res = await ajaxPost(`${environment.apiUrl}/v1/auth/register/`, payload);
        this.auth.setTokens(res.access, res.refresh);
        const profileData: any = {};
        const phone = val(formParticulier, 'phone_number');
        if (phone) profileData.phone_number = phone;
        const cityId = resolveCityId('d-city');
        if (cityId) profileData.city = cityId;
        if (Object.keys(profileData).length) {
          fetch(`${environment.apiUrl}/profil/edit/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${res.access}` },
            body: JSON.stringify(profileData),
          }).catch(() => {});
        }
        setBtnLoading(btn, false, 'M\'inscrire');
        showToast('Compte créé avec succès ! Bienvenue 🎉');
        fermerModal();
        setTimeout(() => this.router.navigate(['/annonces']), 700);
      } catch (err: any) {
        setBtnLoading(btn, false, 'M\'inscrire');
        const msg = err?.email?.[0] || err?.password?.[0] || err?.username?.[0] || err?.error || 'Erreur lors de l\'inscription.';
        showError('reg-part-error', msg);
      }
    });

    // ===== INSCRIPTION AUTO-ENTREPRENEUR (modal-e) =====
    const formAE = document.querySelector('#form-autoentrepreneur') as HTMLFormElement;
    if (formAE) registerForm(formAE, 'reg-ae-error', 'prestataire', 'e-city', '/annonces', ['bio']);

    // ===== INSCRIPTION ENTREPRISE (modal-f) =====
    const formEntreprise = document.querySelector('#form-entreprise') as HTMLFormElement;
    if (formEntreprise) registerForm(formEntreprise, 'reg-ent-error', 'prestataire', 'f-city', '/annonces', ['bio', 'siret']);
  }
}
