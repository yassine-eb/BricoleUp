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

    const showError = (id: string, msg: string) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('p');
        el.id = id;
        el.style.cssText = 'color:#EF4444;font-size:0.85rem;margin-top:8px;text-align:center;';
      }
      el.textContent = msg;
      const modal = document.querySelector('.modal.actif');
      modal?.querySelector('.modal-submit')?.before(el);
    };

    const clearError = (id: string) => document.getElementById(id)?.remove();

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
    const formLogin = document.querySelector('#modal-b .auth-form') as HTMLFormElement;
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError('login-error');
        const email = (formLogin.querySelector('input[type="email"]') as HTMLInputElement)?.value.trim();
        const password = (formLogin.querySelector('input[type="password"]') as HTMLInputElement)?.value;
        const btn = formLogin.querySelector('.modal-submit') as HTMLButtonElement;
        btn.textContent = 'Connexion…';
        btn.disabled = true;

        this.auth.login({ email, password }).subscribe({
          next: (res: any) => {
            btn.textContent = 'Connexion';
            btn.disabled = false;
            fermerModal();
            if (res.admin) { this.router.navigate(['/admin']); return; }
            const redirect = res.redirect === 'dashboard' ? '/dashboard' : '/annonces';
            this.router.navigate([redirect]);
          },
          error: (err: any) => {
            btn.textContent = 'Connexion';
            btn.disabled = false;
            const code = err?.error?.code;
            if (code === 'not_found') {
              showError('login-error', 'Aucun compte trouvé.');
              setTimeout(() => { fermerModal(); ouvrirModal('modal-a'); }, 1500);
            } else {
              showError('login-error', err?.error?.error || 'Mot de passe incorrect.');
            }
          },
        });
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

    // ===== INSCRIPTION PARTICULIER (modal-d) =====
    const formParticulier = document.querySelector('#form-particulier') as HTMLFormElement;
    if (formParticulier) {
      formParticulier.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError('reg-part-error');
        const prenom   = val(formParticulier, 'prenom');
        const nom      = val(formParticulier, 'nom');
        const email    = val(formParticulier, 'email');
        const username = val(formParticulier, 'username');
        const password = val(formParticulier, 'password');
        const phone    = val(formParticulier, 'phone_number');
        const city     = resolveCityId('d-city');
        const gender   = val(formParticulier, 'gender');
        const btn = formParticulier.querySelector('.modal-submit') as HTMLButtonElement;
        btn.textContent = 'Inscription…';
        btn.disabled = true;

        this.auth.register({ email, password, password2: password, nom, prenom, username, role: 'client' }).subscribe({
          next: (res: any) => {
            updateProfile(res.access, { phone_number: phone, city: city || undefined, gender });
            btn.textContent = 'M\'inscrire';
            btn.disabled = false;
            fermerModal();
            this.router.navigate(['/annonces']);
          },
          error: (err: any) => {
            btn.textContent = 'M\'inscrire';
            btn.disabled = false;
            const msg = err?.error?.email?.[0] || err?.error?.password?.[0] || err?.error?.error || 'Erreur lors de l\'inscription.';
            showError('reg-part-error', msg);
          },
        });
      });
    }

    // ===== INSCRIPTION AUTO-ENTREPRENEUR (modal-e) =====
    const formAE = document.querySelector('#form-autoentrepreneur') as HTMLFormElement;
    if (formAE) {
      formAE.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError('reg-ae-error');
        const prenom   = val(formAE, 'prenom');
        const nom      = val(formAE, 'nom');
        const email    = val(formAE, 'email');
        const username = val(formAE, 'username');
        const password = val(formAE, 'password');
        const phone    = val(formAE, 'phone_number');
        const city     = resolveCityId('e-city');
        const bio      = val(formAE, 'bio');
        const btn = formAE.querySelector('.modal-submit') as HTMLButtonElement;
        btn.textContent = 'Inscription…';
        btn.disabled = true;

        this.auth.register({ email, password, password2: password, nom, prenom, username, role: 'prestataire' }).subscribe({
          next: (res: any) => {
            updateProfile(res.access, { phone_number: phone, city: city || undefined, bio });
            btn.textContent = 'M\'inscrire';
            btn.disabled = false;
            fermerModal();
            this.router.navigate(['/dashboard']);
          },
          error: (err: any) => {
            btn.textContent = 'M\'inscrire';
            btn.disabled = false;
            const msg = err?.error?.email?.[0] || err?.error?.password?.[0] || err?.error?.error || 'Erreur lors de l\'inscription.';
            showError('reg-ae-error', msg);
          },
        });
      });
    }

    // ===== INSCRIPTION ENTREPRISE (modal-f) =====
    const formEntreprise = document.querySelector('#form-entreprise') as HTMLFormElement;
    if (formEntreprise) {
      formEntreprise.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError('reg-ent-error');
        const prenom   = val(formEntreprise, 'prenom');
        const nom      = val(formEntreprise, 'nom');
        const email    = val(formEntreprise, 'email');
        const username = val(formEntreprise, 'username');
        const password = val(formEntreprise, 'password');
        const phone    = val(formEntreprise, 'phone_number');
        const city     = resolveCityId('f-city');
        const bio      = val(formEntreprise, 'bio');
        const btn = formEntreprise.querySelector('.modal-submit') as HTMLButtonElement;
        btn.textContent = 'Inscription…';
        btn.disabled = true;

        this.auth.register({ email, password, password2: password, nom, prenom, username, role: 'prestataire' }).subscribe({
          next: (res: any) => {
            updateProfile(res.access, { phone_number: phone, city: city || undefined, bio });
            btn.textContent = 'M\'inscrire';
            btn.disabled = false;
            fermerModal();
            this.router.navigate(['/dashboard']);
          },
          error: (err: any) => {
            btn.textContent = 'M\'inscrire';
            btn.disabled = false;
            const msg = err?.error?.email?.[0] || err?.error?.password?.[0] || err?.error?.error || 'Erreur lors de l\'inscription.';
            showError('reg-ent-error', msg);
          },
        });
      });
    }
  }
}
