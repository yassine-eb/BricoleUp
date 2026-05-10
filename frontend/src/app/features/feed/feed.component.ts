import { Component, AfterViewInit, ViewEncapsulation, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class FeedComponent implements AfterViewInit {

  private http   = inject(HttpClient);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private pageOffres = 1;
  private pageDemandes = 1;
  private allOffresLoaded = false;
  private allDemandesLoaded = false;

  // Legacy kept for compat with puSubmit reset
  private page = 1;
  private allLoaded = false;

  ngAfterViewInit(): void {
    (window as any).navigateTo = (path: string) => this.router.navigate([path]);
    (window as any).preloadRoute = (path: string) => this.router.navigate([path], { skipLocationChange: false });

    // Délégation sur le feed : "Voir profil"
    document.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.btn-voir-profil[data-slug]');
      if (btn) {
        const slug = btn.dataset['slug'];
        if (slug) this.router.navigate(['/profil', slug]);
      }
    });

    // Délégation "Contacter" → popup offre
    document.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.btn-contacter');
      if (!btn) return;
      (window as any).contactOpenOffre(
        btn.dataset['name'] || '',
        btn.dataset['sub'] || '',
        btn.dataset['color'] || '#1B3C6B',
        btn.dataset['init'] || '?',
        btn.dataset['slug'] || ''
      );
    });

    // Délégation "Répondre" → popup réponse
    document.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.btn-repondre');
      if (!btn) return;
      (window as any).contactOpenReponse(
        btn.dataset['name'] || '',
        btn.dataset['color'] || '#1B3C6B',
        btn.dataset['init'] || '?',
        btn.dataset['summary'] || '',
        btn.dataset['slug'] || ''
      );
    });

    // Fonctions globales popups contact
    (window as any).contactOpenOffre = (name: string, sub: string, color: string, init: string, slug: string) => {
      const el = (id: string) => document.getElementById(id);
      (el('contact-title') as HTMLElement).textContent = 'Faire une offre à ' + name;
      (el('contact-sub') as HTMLElement).textContent = sub;
      const av = el('contact-av') as HTMLElement;
      av.textContent = init; av.style.background = color;
      (el('contact-offre-success-sub') as HTMLElement).textContent = name + ' sera notifié et vous répondra bientôt.';
      // Stocker le slug pour l'envoi
      const modal = el('contact-modal-offre') as HTMLElement;
      if (modal) modal.dataset['slug'] = slug;
      // reset
      const prix = el('contact-prix') as HTMLInputElement; if (prix) prix.value = '';
      const desc = el('contact-desc') as HTMLTextAreaElement; if (desc) desc.value = '';
      const cnt = el('contact-desc-count'); if (cnt) cnt.textContent = '0';
      (el('contact-offre-body') as HTMLElement).style.display = '';
      (el('contact-offre-success') as HTMLElement).style.display = 'none';
      (el('contact-offre-footer') as HTMLElement).style.display = '';
      document.querySelectorAll('#contact-delai-chips .contact-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
      el('contact-overlay')!.classList.add('open');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    (window as any).contactOpenReponse = (name: string, color: string, init: string, summary: string, slug: string) => {
      const el = (id: string) => document.getElementById(id);
      (el('rep-title') as HTMLElement).textContent = 'Répondre à ' + name;
      const av = el('rep-av') as HTMLElement; av.textContent = init; av.style.background = color;
      (el('contact-rep-summary') as HTMLElement).textContent = summary;
      (el('contact-rep-success-sub') as HTMLElement).textContent = name + ' sera notifié(e) et vous répondra bientôt.';
      // Stocker le slug pour l'envoi
      const modal = el('contact-modal-reponse') as HTMLElement;
      if (modal) modal.dataset['slug'] = slug;
      // reset
      const msg = el('rep-msg') as HTMLTextAreaElement; if (msg) msg.value = '';
      const cnt = el('rep-msg-count'); if (cnt) cnt.textContent = '0';
      (el('contact-rep-body') as HTMLElement).style.display = '';
      (el('contact-rep-success') as HTMLElement).style.display = 'none';
      (el('contact-rep-footer') as HTMLElement).style.display = '';
      document.querySelectorAll('#rep-dispo-chips .contact-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
      el('contact-overlay')!.classList.add('open');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    (window as any).contactClose = () => {
      document.getElementById('contact-overlay')?.classList.remove('open');
      document.getElementById('contact-modal-offre')?.classList.remove('open');
      document.getElementById('contact-modal-reponse')?.classList.remove('open');
      document.body.style.overflow = '';
    };

    (window as any).contactChip = (el: HTMLElement, groupId: string) => {
      document.querySelectorAll(`#${groupId} .contact-chip`).forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    };

    (window as any).contactCount = (taId: string, cntId: string) => {
      const ta = document.getElementById(taId) as HTMLTextAreaElement;
      const cnt = document.getElementById(cntId);
      if (ta && cnt) cnt.textContent = String(ta.value.length);
    };

    const sendToApi = (slug: string, message: string, onSuccess: () => void) => {
      const token = this.auth.getAccessToken();
      if (!token) { onSuccess(); return; }
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.post<any>(
        `${environment.apiUrl}/conversations/${slug}/`,
        { body: message },
        { headers }
      ).subscribe({ next: onSuccess, error: onSuccess });
    };

    (window as any).contactSendOffre = () => {
      const slug   = (document.getElementById('contact-modal-offre') as HTMLElement)?.dataset['slug'] || '';
      const prix   = (document.getElementById('contact-prix') as HTMLInputElement)?.value?.trim();
      const desc   = (document.getElementById('contact-desc') as HTMLTextAreaElement)?.value?.trim();
      const chips  = document.querySelector('#contact-delai-chips .contact-chip.active') as HTMLElement;
      const delai  = chips?.textContent?.trim() || '';
      const parts  = [];
      if (prix) parts.push(`💰 Budget proposé : ${prix}€`);
      if (desc) parts.push(desc);
      if (delai) parts.push(`⏰ Délai : ${delai}`);
      const message = parts.join('\n');

      const finish = () => {
        document.getElementById('contact-offre-body')!.style.display = 'none';
        document.getElementById('contact-offre-footer')!.style.display = 'none';
        document.getElementById('contact-offre-success')!.style.display = 'flex';
      };
      if (slug && message) sendToApi(slug, message, finish);
      else finish();
    };

    (window as any).contactSendReponse = () => {
      const slug   = (document.getElementById('contact-modal-reponse') as HTMLElement)?.dataset['slug'] || '';
      const msg    = (document.getElementById('rep-msg') as HTMLTextAreaElement)?.value?.trim();
      const chips  = document.querySelector('#rep-dispo-chips .contact-chip.active') as HTMLElement;
      const dispo  = chips?.textContent?.trim() || '';
      const parts  = [];
      if (msg) parts.push(msg);
      if (dispo) parts.push(`📅 Disponibilité : ${dispo}`);
      const message = parts.join('\n');

      const finish = () => {
        document.getElementById('contact-rep-body')!.style.display = 'none';
        document.getElementById('contact-rep-footer')!.style.display = 'none';
        document.getElementById('contact-rep-success')!.style.display = 'flex';
      };
      if (slug && message) sendToApi(slug, message, finish);
      else finish();
    };

    // Fermer avec Escape
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') (window as any).contactClose?.();
    });

    // ===== J'AIME — JS pur + fetch (instantané) =====
    document.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.btn-like, .fp-like-btn');
      if (!btn) return;

      // Toggle UI immédiat
      const isLiked = btn.classList.toggle('liked');
      const svgs = btn.querySelectorAll('svg');
      const countEl = btn.querySelector('.fp-like-count') as HTMLElement;

      svgs.forEach(svg => {
        svg.setAttribute('fill', isLiked ? '#F97316' : 'none');
        svg.setAttribute('stroke', isLiked ? '#F97316' : 'currentColor');
      });
      if (countEl) {
        const cur = parseInt(countEl.textContent || '0') || 0;
        countEl.textContent = String(isLiked ? cur + 1 : Math.max(0, cur - 1));
      }

      // LocalStorage pour les cards annonces
      const raw = btn.dataset['card'];
      if (raw) {
        try {
          const card = JSON.parse(decodeURIComponent(raw));
          const stored: any[] = JSON.parse(localStorage.getItem('bu_liked_cards') || '[]');
          const idx = stored.findIndex((c: any) => c.id === card.id);
          if (isLiked && idx === -1) stored.push(card);
          else if (!isLiked && idx !== -1) stored.splice(idx, 1);
          localStorage.setItem('bu_liked_cards', JSON.stringify(stored));
          window.dispatchEvent(new CustomEvent('bu:favcount', { detail: stored.length }));
        } catch {}
      }

      // Appel API en arrière-plan via fetch (sans bloquer l'UI)
      const slug = btn.dataset['slug'];
      const token = this.auth.getAccessToken();
      if (token && slug) {
        fetch(`${environment.apiUrl}/v1/favorites/${slug}/favorite/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: '{}',
        }).catch(() => {});
      }
    });

    this.loadOffres();
    this.loadDemandes();
    this.loadVille();
    this.loadProfil();
    this.loadFavorisFromApi();
    this.loadSkills();

    // ===== LIGHTBOX IMAGE =====
    (window as any).closeImgLightbox = () => {
      const lb = document.getElementById('img-lightbox');
      if (lb) { lb.style.display = 'none'; document.body.style.overflow = ''; }
    };
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') (window as any).closeImgLightbox?.();
    });
    document.addEventListener('click', (e: Event) => {
      const img = (e.target as HTMLElement).closest<HTMLImageElement>(
        '.fc-img-grid img, .fc-img-main img, .fc-img-small img, .fp-img-wrap img, .fc-avatar-img'
      );
      if (!img || !img.src) return;
      const lb = document.getElementById('img-lightbox');
      const lbImg = document.getElementById('img-lightbox-img') as HTMLImageElement;
      if (lb && lbImg) {
        lbImg.src = img.src;
        lb.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    });

    // ===== MODAL PORTFOLIO =====
    (window as any).openPortfolioModal = () => {
      if (!this.auth.getAccessToken()) { this.router.navigate(['/auth/login']); return; }
      document.getElementById('portfolio-overlay')?.classList.add('pu-open');
      document.getElementById('portfolio-modal')?.classList.add('pu-open');
      document.body.style.overflow = 'hidden';
    };
    (window as any).closePortfolioModal = () => {
      document.getElementById('portfolio-overlay')?.classList.remove('pu-open');
      document.getElementById('portfolio-modal')?.classList.remove('pu-open');
      document.body.style.overflow = '';
    };
    (window as any).previewPortfolioImg = (input: HTMLInputElement) => {
      const file = input.files?.[0];
      if (!file) return;
      const zone = document.getElementById('portfolio-zone') as HTMLElement;
      const reader = new FileReader();
      reader.onload = (e) => {
        zone.innerHTML = `<img src="${e.target?.result}" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`;
      };
      reader.readAsDataURL(file);
    };
    (window as any).submitPortfolio = () => {
      const token = this.auth.getAccessToken();
      if (!token) return;
      const desc = (document.getElementById('portfolio-desc') as HTMLTextAreaElement)?.value?.trim();
      const file = (document.getElementById('portfolio-file') as HTMLInputElement)?.files?.[0];
      const errEl = document.getElementById('portfolio-error') as HTMLElement;
      const btn = document.getElementById('portfolio-submit-btn') as HTMLButtonElement;

      if (!desc) { errEl.style.display = 'block'; errEl.textContent = 'La description est obligatoire.'; return; }
      errEl.style.display = 'none';
      btn.textContent = 'Publication…'; btn.disabled = true;

      const formData = new FormData();
      formData.append('description', desc);
      if (file) formData.append('image1', file);

      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.post<any>(`${environment.apiUrl}/v1/my-projects/`, formData, { headers }).subscribe({
        next: (project) => {
          btn.textContent = 'Publier mon portfolio'; btn.disabled = false;
          (window as any).closePortfolioModal();
          (document.getElementById('portfolio-desc') as HTMLTextAreaElement).value = '';
          // Recharger le portfolio
          const container = document.getElementById('feed-container-portfolio');
          if (container) { container.innerHTML = ''; this.loadPortfolio(); }
        },
        error: (err) => {
          btn.textContent = 'Publier mon portfolio'; btn.disabled = false;
          errEl.style.display = 'block';
          errEl.textContent = err?.error?.error || 'Erreur lors de la publication.';
        }
      });
    };

    // Contacter portfolio
    document.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.fp-btn-contacter');
      if (!btn) return;
      const slug = btn.dataset['slug'];
      if (!slug) return;
      if (!this.auth.getAccessToken()) { this.router.navigate(['/auth/login']); return; }
      this.router.navigate(['/messages'], { queryParams: { slug } });
    });

    // Envoyer commentaire portfolio
    document.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.fp-comment-send');
      if (!btn) return;
      const projectId = Number(btn.dataset['project']);
      if (projectId) this.sendProjectComment(projectId);
    });

    // Voir plus de commentaires
    document.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.fp-show-more');
      if (!btn) return;
      const projectId = Number(btn.dataset['project']);
      const comments = JSON.parse(btn.dataset['comments'] || '[]');
      this.renderComments(projectId, comments, true);
    });


    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const input = e.target as HTMLElement;
      if (e.key === 'Enter' && input.classList.contains('fp-comment-input')) {
        const projectId = Number(input.id.replace('fp-input-', ''));
        if (projectId) this.sendProjectComment(projectId);
      }
    });


    // Délégation favoris portfolio — JS pur instantané
    document.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.fp-fav-btn');
      if (!btn) return;
      const slug = btn.dataset['slug'];
      const token = this.auth.getAccessToken();
      if (!token) { this.router.navigate(['/auth/login']); return; }

      // UI instantanée
      const isActive = btn.classList.toggle('active');
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isActive ? '#F97316' : 'none');
        svg.setAttribute('stroke', isActive ? '#F97316' : 'currentColor');
      }

      // fetch arrière-plan
      if (slug) {
        fetch(`${environment.apiUrl}/v1/favorites/${slug}/favorite/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: '{}',
        }).catch(() => {});
      }
    });

    // ===== FILTRE VUE FEED =====
    (window as any).setFeedView = (view: string) => {
      document.querySelectorAll('#feed-container .fc-card').forEach((card: any) => {
        if (view === 'all') card.style.display = '';
        else if (view === 'offres') card.style.display = card.classList.contains('fc-card-offre') ? '' : 'none';
        else if (view === 'demandes') card.style.display = card.classList.contains('fc-card-demande') ? '' : 'none';
      });
    };

    // ===== TOGGLE SECTIONS OFFRES / DEMANDES / PORTFOLIO =====
    let portfolioLoaded = false;
    (window as any).setFeedSection = (section: string) => {
      document.querySelectorAll('.feed-toggle-pill').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.feed-section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.feed-tabs-wrap').forEach((el: any) => {
        el.style.display = section === 'portfolio' ? 'none' : '';
      });
      document.getElementById(`pill-${section}`)?.classList.add('active');
      document.getElementById(`feed-section-${section}`)?.classList.add('active');

      if (section === 'portfolio' && !portfolioLoaded) {
        portfolioLoaded = true;
        this.loadPortfolio();
      }
    };

    // ===== PU MODALS =====
    const puOuvrir = (id: string) => {
      document.querySelectorAll('.pu-modal').forEach(m => m.classList.remove('pu-open'));
      document.getElementById(id)?.classList.add('pu-open');
      document.getElementById('pu-overlay')?.classList.add('pu-open');
      document.body.style.overflow = 'hidden';
    };
    const puFermer = () => {
      document.querySelectorAll('.pu-modal').forEach(m => m.classList.remove('pu-open'));
      document.getElementById('pu-overlay')?.classList.remove('pu-open');
      document.body.style.overflow = '';
    };

    (window as any).openModal  = () => puOuvrir('modal-choix');
    (window as any).puOuvrir   = puOuvrir;
    (window as any).puFermer   = puFermer;
    (window as any).puOverlayClick = (e: MouseEvent) => {
      if (e.target === document.getElementById('pu-overlay')) puFermer();
    };

    // Stepper
    const puUpdateStepper = (prefix: string, total: number, step: number) => {
      for (let i = 1; i <= total; i++) {
        const circle = document.getElementById(`${prefix}-circle-${i}`) as HTMLElement;
        const line   = document.getElementById(`${prefix}-line-${i}`) as HTMLElement;
        if (!circle) continue;
        circle.classList.remove('pu-active','pu-done');
        if (i < step)      { circle.classList.add('pu-done');   circle.textContent = '✓'; }
        else if (i === step){ circle.classList.add('pu-active'); circle.textContent = String(i); }
        else                { circle.textContent = String(i); }
        if (line) line.classList.toggle('pu-done', i < step);
      }
    };

    const puGoStep = (prefix: string, step: number) => {
      const total = prefix === 'd' ? 3 : 2;
      for (let i = 1; i <= total; i++) {
        const el = document.getElementById(`${prefix}-step-${i}`) as HTMLElement;
        if (!el) continue;
        el.style.display = i === step ? 'flex' : 'none';
        el.style.flexDirection = 'column';
      }
      puUpdateStepper(prefix, total, step);
    };

    (window as any).puGoStep    = puGoStep;
    (window as any).puNextStep  = (prefix: string, current: number) => puGoStep(prefix, current + 1);

    (window as any).puSelectCat = (el: HTMLElement, prefix: string) => {
      const grid = el.closest('.pu-cat-grid');
      grid?.querySelectorAll('.pu-cat').forEach(c => c.classList.remove('pu-selected'));
      el.classList.add('pu-selected');
    };

    (window as any).puSelectType = (type: string) => {
      document.getElementById('d-type-pub')?.classList.toggle('pu-radio-active', type === 'publique');
      document.getElementById('d-type-priv')?.classList.toggle('pu-radio-active', type === 'privee');
    };

    (window as any).puToggleUrgence = () => {
      const cb    = document.getElementById('d-urgence') as HTMLInputElement;
      const track = cb?.closest('.pu-toggle')?.querySelector('.pu-toggle-track') as HTMLElement;
      const thumb = track?.querySelector('.pu-toggle-thumb') as HTMLElement;
      const row   = document.getElementById('d-urgence-row') as HTMLElement;
      if (track) track.classList.toggle('pu-toggle-on', cb.checked);
      if (thumb) thumb.classList.toggle('pu-thumb-on', cb.checked);
      if (row) {
        row.style.borderColor = cb.checked ? '#EF4444' : '#E2E8F0';
        row.style.background  = cb.checked ? '#FEF2F2' : '';
      }
    };

    (window as any).puToggleDispo = () => {
      const cb    = document.getElementById('o-dispo') as HTMLInputElement;
      const track = cb?.closest('.pu-toggle')?.querySelector('.pu-toggle-track') as HTMLElement;
      const thumb = track?.querySelector('.pu-toggle-thumb') as HTMLElement;
      if (track) track.classList.toggle('pu-toggle-on', cb.checked);
      if (thumb) thumb.classList.toggle('pu-thumb-on', cb.checked);
    };

    (window as any).puTriggerFile = (id: string) => document.getElementById(id)?.click();

    (window as any).puPreview = (input: HTMLInputElement, zoneId: string) => {
      const file = input.files?.[0];
      if (!file) return;
      const zone = document.getElementById(zoneId) as HTMLElement;
      const reader = new FileReader();
      reader.onload = (e) => {
        let img = zone.querySelector('img') as HTMLImageElement;
        if (!img) { img = document.createElement('img'); zone.appendChild(img); }
        img.src = e.target?.result as string;
        const icon = zone.querySelector('.pu-upload-icon') as HTMLElement;
        if (icon) icon.style.display = 'none';
      };
      reader.readAsDataURL(file);
    };

    // Toast inline dans le modal (remplace alert)
    const puToast = (msg: string, type: 'error'|'success' = 'error') => {
      const existing = document.getElementById('pu-toast');
      if (existing) existing.remove();
      const t = document.createElement('div');
      t.id = 'pu-toast';
      const bg = type === 'success' ? '#22C55E' : '#EF4444';
      t.style.cssText = `margin:0 20px 14px;background:${bg};color:#fff;border-radius:10px;padding:11px 16px;font-size:.88rem;font-weight:600;display:flex;align-items:center;gap:8px;animation:puFadeIn .2s ease`;
      t.innerHTML = `<span style="font-size:1rem">${type === 'success' ? '✅' : '⚠️'}</span> ${msg}`;
      const body = type === 'success'
        ? document.querySelector('.pu-modal.pu-open')
        : document.querySelector('.pu-modal.pu-open .pu-body:not([style*="none"])') || document.querySelector('.pu-modal.pu-open');
      if (body) body.insertBefore(t, body.firstChild);
      if (type === 'success') setTimeout(() => t.remove(), 3000);
    };

    (window as any).puSubmit = (type: string) => {
      const token = this.auth.getAccessToken();
      if (!token) {
        puFermer();
        this.router.navigate(['/auth/login']);
        return;
      }

      const val = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value?.trim() || '';

      const submitBtn = document.querySelector(`[onclick="puSubmit('${type}')"]`) as HTMLButtonElement;
      const setBtn = (txt: string, dis: boolean) => { if (submitBtn) { submitBtn.textContent = txt; submitBtn.disabled = dis; } };
      setBtn('Publication en cours…', true);

      let body: any = { type };

      if (type === 'demande') {
        const description = val('d-desc');
        if (!description) {
          puToast('La description est obligatoire.');
          setBtn('Publier ma demande', false);
          return;
        }
        body.description = description;
        body.budget_min  = val('d-budget-min') || null;
        body.budget_max  = val('d-budget-max') || null;
      } else {
        const titre = val('o-titre');
        const desc  = val('o-desc');
        if (!desc && !titre) {
          puToast('Le titre ou la description est obligatoire.');
          setBtn('Publier mon offre', false);
          return;
        }
        body.description = titre ? `${titre}\n\n${desc}` : desc;
        body.budget_min  = val('o-tarif') || null;
      }

      this.http.post<any>(
        `${environment.apiUrl}/v1/create_announcement_simple/`,
        body,
        { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      ).subscribe({
        next: (res) => {
          if (res.success) {
            // Remplacer le contenu du modal par un écran succès
            const modal = document.querySelector('.pu-modal.pu-open') as HTMLElement;
            if (modal) {
              modal.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;padding:40px 24px;text-align:center;gap:16px">
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#22C55E" stroke-width="4" stroke-dasharray="200" stroke-dashoffset="200" style="animation:drawCircle .5s ease forwards"/>
                    <path d="M20 36l12 12 20-20" fill="none" stroke="#22C55E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="60" stroke-dashoffset="60" style="animation:drawCheck .3s ease .4s forwards"/>
                  </svg>
                  <div style="font-family:Poppins,sans-serif;font-size:1.3rem;font-weight:800;color:#1B3C6B">
                    ${type === 'offre' ? 'Offre publiée !' : 'Demande publiée !'}
                  </div>
                  <p style="color:#64748B;font-size:.9rem;margin:0">
                    Votre annonce est en ligne et visible par la communauté.
                  </p>
                  <button onclick="puFermer()" style="background:#1B3C6B;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-family:Poppins,sans-serif;font-weight:700;font-size:.95rem;cursor:pointer;margin-top:8px">
                    Voir le feed →
                  </button>
                </div>`;
            }
            setTimeout(() => {
              this.pageOffres = 1; this.allOffresLoaded = false;
              this.pageDemandes = 1; this.allDemandesLoaded = false;
              ['feed-container-offres','feed-container-demandes'].forEach(id => {
                const el = document.getElementById(id); if (el) el.innerHTML = '';
              });
              ['btn-load-more-offres','btn-load-more-demandes'].forEach(id => {
                const b = document.getElementById(id) as HTMLButtonElement;
                if (b) { b.style.opacity = '1'; b.style.cursor = 'pointer'; b.disabled = false; }
              });
              this.loadOffres();
              this.loadDemandes();
            }, 500);
          } else {
            puToast(res.error || 'Erreur lors de la publication.');
            setBtn(type === 'offre' ? 'Publier mon offre' : 'Publier ma demande', false);
          }
        },
        error: (err) => {
          const msg = err?.error?.error || err?.error?.detail || `Erreur ${err.status}`;
          puToast(msg);
          setBtn(type === 'offre' ? 'Publier mon offre' : 'Publier ma demande', false);
        }
      });
    };

    // ===== TOGGLE CLIENT / PRESTATAIRE =====
    (window as any).switchView = (mode: string) => {
      const sidebarClient = document.getElementById('sidebar-client') as HTMLElement;
      const sidebarPresta = document.getElementById('sidebar-presta') as HTMLElement;
      const pillClient = document.getElementById('pill-client') as HTMLElement;
      const pillPresta = document.getElementById('pill-presta') as HTMLElement;
      const greetingText = document.getElementById('greeting-text') as HTMLElement;
      const greetingSub = document.getElementById('greeting-sub') as HTMLElement;

      if (sidebarClient) sidebarClient.style.display = mode === 'client' ? 'block' : 'none';
      if (sidebarPresta) sidebarPresta.style.display = mode === 'presta' ? 'block' : 'none';

      if (mode === 'client') {
        if (pillClient) pillClient.className = 'toggle-pill active-client';
        if (pillPresta) pillPresta.className = 'toggle-pill';
        if (greetingSub) greetingSub.textContent = '';
      } else {
        if (pillClient) pillClient.className = 'toggle-pill';
        if (pillPresta) pillPresta.className = 'toggle-pill active-presta';
        if (greetingSub) greetingSub.textContent = '· Vos matchs du jour';
      }
    };

    // ===== FILTRES TABS (sélection multiple) =====
    const activeFilters = new Set<string>();

    const applyFilters = () => {
      ['feed-container-offres', 'feed-container-demandes'].forEach(id => {
        document.querySelectorAll(`#${id} [data-categorie]`).forEach((card: any) => {
          if (activeFilters.size === 0) {
            card.style.display = '';
          } else {
            card.style.display = activeFilters.has(card.dataset.categorie) ? '' : 'none';
          }
        });
      });
    };

    document.getElementById('chips-container')?.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.feed-tab');
      if (!btn) return;
      const filter = btn.dataset['filter'] || 'tous';

      if (filter === 'tous') {
        // Réinitialiser tout
        activeFilters.clear();
        document.querySelectorAll('.feed-tab').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
      } else {
        // Désactiver "Tout"
        document.querySelector('.feed-tab[data-filter="tous"]')?.classList.remove('active');

        if (activeFilters.has(filter)) {
          activeFilters.delete(filter);
          btn.classList.remove('active');
          // Si plus rien de sélectionné, réactiver "Tout"
          if (activeFilters.size === 0) {
            document.querySelector('.feed-tab[data-filter="tous"]')?.classList.add('active');
          }
        } else {
          activeFilters.add(filter);
          btn.classList.add('active');
        }
      }
      applyFilters();
    });


    // ===== TOGGLE FAVORIS =====
    (window as any).toggleFavoris = (btn: HTMLElement) => {
      btn.classList.toggle('active');
      btn.textContent = btn.classList.contains('active') ? '♥ Favoris' : '♡ Favoris';
    };

    (window as any).loadMore = () => this.loadOffres();
    (window as any).loadMoreOffres   = () => this.loadOffres();
    (window as any).loadMoreDemandes = () => this.loadDemandes();

    // ===== UPLOAD PHOTOS =====
    (window as any).triggerUpload = (n: number) => {
      document.getElementById(`file-${n}`)?.click();
    };

    (window as any).previewImage = (n: number, input: HTMLInputElement) => {
      const file = input.files?.[0];
      if (!file) return;
      const preview = document.getElementById(`preview-${n}`) as HTMLImageElement;
      const icon = document.getElementById(`icon-${n}`) as HTMLElement;
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target?.result as string;
        preview.style.display = 'block';
        icon.style.display = 'none';
      };
      reader.readAsDataURL(file);
    };

    // ===== KEYBOARD CLOSE MODAL =====
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') (window as any).closeModal();
    });
  }

  private loadProfil(): void {
    const token = this.auth.getAccessToken();
    const greetingEl = document.getElementById('greeting-text') as HTMLElement;
    const avatarEl   = document.getElementById('nav-avatar') as HTMLElement;

    // Greeting heure
    const h = new Date().getHours();
    const salut = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';

    // Affichage immédiat depuis localStorage
    const cachedUser = this.auth.currentUser$();
    const cachedPrenom = (cachedUser as any)?.prenom || (cachedUser as any)?.first_name || (cachedUser as any)?.username || '';
    if (cachedPrenom && greetingEl) {
      greetingEl.childNodes[0].textContent = `${salut} ${cachedPrenom} 👋 `;
      if (avatarEl) avatarEl.textContent = cachedPrenom.slice(0, 2).toUpperCase();
    } else {
      if (greetingEl) greetingEl.childNodes[0].textContent = `${salut} 👋 `;
    }

    if (token) {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.get<any>(`${environment.apiUrl}/account/infos/`, { headers }).subscribe({
        next: (res) => {
          const prenom = res?.first_name || res?.profile?.first_name || res?.username || '';
          const initiales = prenom ? prenom.slice(0, 2).toUpperCase() : '?';
          if (greetingEl) {
            greetingEl.childNodes[0].textContent = prenom ? `${salut} ${prenom} 👋 ` : `${salut} 👋 `;
          }
          if (avatarEl) avatarEl.textContent = initiales;
        },
      });
    } else {
      if (avatarEl) avatarEl.textContent = '?';
    }
  }

  private loadSkills(): void {
    this.http.get<any>(`${environment.apiUrl}/v1/skills/`).subscribe({
      next: (res) => {
        const skills: any[] = res?.results || res || [];
        const container = document.getElementById('chips-container');
        if (!container || !skills.length) return;
        skills.forEach((s: any) => {
          const btn = document.createElement('button');
          const slug = (s.name_fr || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'-');
          btn.className = 'feed-tab';
          btn.dataset['filter'] = slug;
          btn.textContent = s.name_fr;
          // le listener chips-container gère déjà les boutons dynamiques
          container.appendChild(btn);
        });
      },
    });
  }

  private setVilleLabel(ville: string): void {
    // Met à jour dans le feed header mobile
    const feedEl = document.getElementById('ville-label') as HTMLElement;
    if (feedEl) feedEl.textContent = ville;
    // Met à jour dans la navbar desktop
    const navEl = document.querySelector('.nav-logo-location') as HTMLElement;
    if (navEl) navEl.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${ville}`;
  }

  private loadVille(): void {
    // Affiche immédiatement via IP, puis remplace si GPS disponible
    this.loadVilleParIP();

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.http.get<any>(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        ).subscribe({
          next: (res) => {
            const ville = res?.address?.city || res?.address?.town || res?.address?.village || res?.address?.county;
            if (ville) this.setVilleLabel(ville);
          },
        });
      },
      () => {}
    );
  }

  private loadVilleParIP(): void {
    this.http.get<any>(`${environment.apiUrl}/geo/city/`).subscribe({
      next: (res) => {
        const ville = res?.city;
        if (ville) this.setVilleLabel(ville);
        else this.loadVilleDepuisProfil();
      },
      error: () => this.loadVilleDepuisProfil(),
    });
  }

  private loadVilleDepuisProfil(): void {
    const token = this.auth.getAccessToken();
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>(`${environment.apiUrl}/account/infos/`, { headers }).subscribe({
      next: (res) => {
        const ville = res?.profile?.city?.name_fr || res?.city?.name_fr;
        if (ville) this.setVilleLabel(ville);
      },
    });
  }

  private loadFavorisFromApi(): void {
    const token = this.auth.getAccessToken();
    if (!token) { localStorage.removeItem('bu_liked_cards'); return; }
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>(`${environment.apiUrl}/v1/favorites/`, { headers }).subscribe({
      next: (res) => {
        const items = res?.results || res || [];
        const cards = items.map((f: any) => ({
          id: f.id || f.announcement?.id,
          type: f.type || 'offre',
          slug: f.slug || f.profile?.slug,
        }));
        localStorage.setItem('bu_liked_cards', JSON.stringify(cards));
        window.dispatchEvent(new CustomEvent('bu:favcount', { detail: cards.length }));
      },
      error: () => {},
    });
  }

  private loadOffres(): void {
    if (this.allOffresLoaded) return;
    const btn = document.getElementById('btn-load-more-offres') as HTMLButtonElement;
    if (btn) { btn.textContent = 'Chargement…'; btn.disabled = true; }

    this.http.get<any>(`${environment.apiUrl}/v1/annonces/?page=${this.pageOffres}&categories=offre_service`).subscribe({
      next: (res) => {
        const items: any[] = res?.results ?? (Array.isArray(res) ? res : []);
        const hasNext: boolean = res?.has_next === true || (Array.isArray(res) && res.length >= 5);

        const feed = document.getElementById('feed-container-offres');
        if (feed) {
          items.forEach((a: any) => feed.appendChild(this.buildCard(a)));
        }
        this.pageOffres++;
        this.setLoadBtn(btn, hasNext && items.length > 0, 'Charger plus d\'offres ↓', () => { this.allOffresLoaded = true; });
        this.reapplyFilters();
      },
      error: () => { if (btn) { btn.textContent = 'Charger plus d\'offres ↓'; btn.disabled = false; } },
    });
  }

  private loadDemandes(): void {
    if (this.allDemandesLoaded) return;
    const btn = document.getElementById('btn-load-more-demandes') as HTMLButtonElement;
    if (btn) { btn.textContent = 'Chargement…'; btn.disabled = true; }

    this.http.get<any>(`${environment.apiUrl}/v1/annonces/?page=${this.pageDemandes}&categories=demande_prestation`).subscribe({
      next: (res) => {
        const items: any[] = res?.results ?? (Array.isArray(res) ? res : []);
        const hasNext: boolean = res?.has_next === true || (Array.isArray(res) && res.length >= 5);

        const feed = document.getElementById('feed-container-demandes');
        if (feed) {
          items.forEach((a: any) => feed.appendChild(this.buildCard(a)));
        }
        this.pageDemandes++;
        this.setLoadBtn(btn, hasNext && items.length > 0, 'Charger plus de demandes ↓', () => { this.allDemandesLoaded = true; });
        this.reapplyFilters();
      },
      error: () => { if (btn) { btn.textContent = 'Charger plus de demandes ↓'; btn.disabled = false; } },
    });
  }

  private setLoadBtn(btn: HTMLButtonElement | null, hasMore: boolean, label: string, onDone: () => void): void {
    if (!btn) return;
    if (hasMore) {
      btn.textContent = label;
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    } else {
      onDone();
      btn.textContent = 'Tout est chargé ✓';
      btn.style.opacity = '0.5';
      btn.style.cursor = 'default';
      btn.disabled = true;
    }
  }

  private reapplyFilters(): void {
    const activeTab = (document.querySelector('.feed-tab.active') as HTMLElement)?.dataset['filter'] || 'tous';
    if (activeTab === 'tous') return;
    ['feed-container-offres','feed-container-demandes'].forEach(id => {
      document.querySelectorAll(`#${id} [data-categorie]`).forEach((c: any) => {
        c.style.display = c.dataset.categorie === activeTab ? '' : 'none';
      });
    });
  }

  private loadAnnonces(): void {
    this.loadOffres();
    this.loadDemandes();
  }

  private buildCard(a: any): HTMLElement {
    const username = a.created_by?.username || 'Utilisateur';
    const initials = username.slice(0, 2).toUpperCase();
    const profile = a.created_by?.profile;
    const profileSlug = profile?.slug || username;
    const picUrl = profile?.profile_picture_url && !profile.profile_picture_url.includes('defaultprofile')
      ? profile.profile_picture_url : null;
    const city = a.city?.name_fr || '';
    const skill = a.skills?.[0]?.name_fr || '';
    const isOffre = a.category?.id === 2 || a.category?.name_fr?.toLowerCase().includes('offre');
    const descFull = (a.description || '').replace(/\r\n|\r|\n/g, ' ').trim();
    const descShort = descFull.slice(0, 120);
    const hasMore = descFull.length > 120;
    const desc = descShort;
    const msgs = a.messages_sent || 0;
    const budget = a.a_convenir ? 'À convenir' : (a.budget_min && a.budget_max ? `${a.budget_min} – ${a.budget_max} €` : (a.budget_min ? `${a.budget_min} €` : 'À convenir'));
    const timeAgo = this.timeAgo(a.created_at);
    const color = this.colorFor(username);
    const categorie = skill.toLowerCase().replace(/\s+/g, '');
    const isVerif = profile?.is_verified;

    // Avatar
    const avatarHtml = picUrl
      ? `<img src="${picUrl}" class="fc-avatar-img" alt="${username}">`
      : `<div class="fc-avatar-initials" style="background:${color};">${initials}</div>`;

    // Images grille
    const imgs = [a.image1, a.image2, a.image3].filter(Boolean);
    const imgGrid = imgs.length ? `
      <div class="fc-img-grid fc-img-${Math.min(imgs.length, 3)}">
        ${imgs.slice(0, 3).map(src => `<img src="${src}" alt="photo" loading="lazy">`).join('')}
      </div>` : '';

    const cardData = encodeURIComponent(JSON.stringify({
      id: a.id, type: isOffre ? 'offre' : 'demande',
      desc: desc.slice(0, 120), username, city, budget,
    }));
    const storedLikes: any[] = (() => { try { return JSON.parse(localStorage.getItem('bu_liked_cards') || '[]'); } catch { return []; } })();
    const isLiked = storedLikes.some(c => c.id === a.id);
    const likeClass = isLiked ? 'fc-btn-ghost btn-like liked' : 'fc-btn-ghost btn-like';
    const likeIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="${isLiked ? '#F97316' : 'none'}" stroke="${isLiked ? '#F97316' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

    const wrapper = document.createElement('div');

    const locationHtml = city ? `
      <div class="fc-location-pill">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${city}
      </div>` : '';

    const descFull64 = btoa(unescape(encodeURIComponent(descFull)));
    const descHtml = `
      <div class="fc-desc-block">
        <p class="fc-desc">${desc}${hasMore ? '<span class="fc-desc-dots"> …</span>' : ''}</p>
        ${hasMore ? `<button class="fc-read-more" data-full="${descFull64}" onclick="
          var p=this.previousElementSibling;
          p.classList.add('expanded');
          p.textContent=decodeURIComponent(escape(atob(this.dataset.full)));
          this.remove();
        ">Lire la suite →</button>` : ''}
      </div>`;

    if (isOffre) {
      wrapper.innerHTML = `
        <div class="fc-card fc-card-offre" data-categorie="${categorie}">
          <div class="fc-card-top">
            <div class="fc-badges">
              <span class="fc-badge-offre">⚡ Offre de service</span>
              ${skill ? `<span class="fc-badge-skill">${skill}</span>` : ''}
            </div>
            <span class="fc-time">${timeAgo}</span>
          </div>
          <div class="fc-user-row">
            <div class="fc-avatar-wrap">
              ${avatarHtml}
              <span class="fc-verif-dot ${isVerif ? 'verified' : 'part'}"></span>
            </div>
            <div class="fc-user-info">
              <div class="fc-username">${username}</div>
              <div class="fc-user-meta">
                ${skill ? `<span class="fc-metier-tag">${skill}</span>` : ''}
                ${locationHtml}
              </div>
            </div>
            ${isVerif ? `<span class="fc-pro-badge">Pro ✓</span>` : ''}
          </div>
          ${imgGrid}
          ${descHtml}
          <div class="fc-footer-offre">
            <button class="fc-btn-primary btn-contacter" data-name="${username}" data-sub="${skill ? skill + ' · ' + city : city}" data-color="${color}" data-init="${initials}" data-slug="${profileSlug}">💬 Contacter</button>
            <button class="${likeClass}" data-card="${cardData}" data-slug="${profileSlug}">
              ${likeIcon} J'aime
            </button>
            <button class="fc-btn-ghost btn-voir-profil" data-slug="${profileSlug}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Profil
            </button>
          </div>
        </div>`;
    } else {
      const repliesHtml = msgs > 0
        ? `<span class="fc-replies-badge has-replies">💬 ${msgs} réponse${msgs > 1 ? 's' : ''}</span>`
        : `<span class="fc-replies-badge no-replies">0 réponse</span>`;
      wrapper.innerHTML = `
        <div class="fc-card fc-card-demande" data-categorie="${categorie}">
          <div class="fc-card-top">
            <div class="fc-badges">
              <span class="fc-badge-demande">📋 Demande</span>
              ${skill ? `<span class="fc-badge-skill">${skill}</span>` : ''}
            </div>
            <span class="fc-time">${timeAgo}</span>
          </div>
          <div class="fc-user-row">
            <div class="fc-avatar-wrap">${avatarHtml}</div>
            <div class="fc-user-info">
              <div class="fc-username">${username}</div>
              <div class="fc-user-meta">
                ${locationHtml}
              </div>
            </div>
            <div class="fc-budget-pill">${budget}</div>
          </div>
          ${imgGrid}
          ${descHtml}
          <div class="fc-footer-demande">
            ${repliesHtml}
            <div class="fc-actions">
              <button class="${likeClass}" data-card="${cardData}" data-slug="${profileSlug}">
                ${likeIcon} J'aime
              </button>
              <button class="fc-btn-primary-sm btn-repondre" data-name="${username}" data-color="${color}" data-init="${initials}" data-slug="${profileSlug}" data-summary="${skill ? skill + ' · ' : ''}${city}${budget !== 'À convenir' ? ' · ' + budget : ''}">Répondre →</button>
            </div>
          </div>
        </div>`;
    }
    return wrapper.firstElementChild as HTMLElement;
  }

  private renderComments(projectId: number, comments: any[], showAll = false): void {
    const list = document.getElementById(`fp-comments-list-${projectId}`);
    const countEl = document.getElementById(`fp-count-${projectId}`);
    const showMoreBtn = document.getElementById(`fp-show-more-${projectId}`);
    if (!list) return;

    const total = comments.length;
    const toShow = showAll ? comments : comments.slice(0, 2);

    list.innerHTML = toShow.map(c => `
      <div class="fp-comment">
        <span class="fp-comment-user">${c.user?.username || 'Utilisateur'}</span>
        <span class="fp-comment-text">${c.content}</span>
      </div>`).join('');

    if (countEl) countEl.textContent = `${total} commentaire${total > 1 ? 's' : ''}`;
    if (showMoreBtn) {
      if (!showAll && total > 2) {
        showMoreBtn.style.display = 'block';
        showMoreBtn.textContent = `Voir les ${total - 2} autres commentaires`;
        showMoreBtn.dataset['comments'] = JSON.stringify(comments);
      } else {
        showMoreBtn.style.display = 'none';
      }
    }
  }

  private loadProjectComments(projectId: number): void {
    this.http.get<any[]>(`${environment.apiUrl}/v1/projects/${projectId}/comments/`).subscribe({
      next: (comments) => this.renderComments(projectId, comments)
    });
  }

  private sendProjectComment(projectId: number): void {
    const input = document.getElementById(`fp-input-${projectId}`) as HTMLInputElement;
    const content = input?.value?.trim();
    if (!content) return;
    const token = this.auth.getAccessToken();
    if (!token) { this.router.navigate(['/auth/login']); return; }

    // Affichage immédiat
    const list = document.getElementById(`fp-comments-list-${projectId}`);
    const countEl = document.getElementById(`fp-count-${projectId}`);
    const div = document.createElement('div');
    div.className = 'fp-comment fp-comment-new';
    const greetingEl = document.getElementById('greeting-text');
    const username = (greetingEl?.childNodes[0]?.textContent || '').replace(/Bon(jour|soir|après-midi)\s*/i, '').replace('👋', '').trim() || 'Moi';
    div.innerHTML = `<span class="fp-comment-user">${username || 'Moi'}</span><span class="fp-comment-text">${content}</span>`;
    if (list) { list.appendChild(div); list.scrollTop = list.scrollHeight; }
    if (countEl) {
      const cur = parseInt(countEl.textContent || '0') || 0;
      const next = cur + 1;
      countEl.textContent = `${next} commentaire${next > 1 ? 's' : ''}`;
    }
    input.value = '';

    // Envoi en arrière-plan
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.post<any>(`${environment.apiUrl}/v1/projects/${projectId}/comments/`, { content }, { headers }).subscribe();
  }


  private loadPortfolio(): void {
    const container = document.getElementById('feed-container-portfolio');
    if (!container) return;
    container.innerHTML = '<div class="feed-portfolio-empty">Chargement…</div>';

    this.http.get<any[]>(`${environment.apiUrl}/v1/projects/`).subscribe({
      next: (projects) => {
        if (!projects.length) {
          container.innerHTML = '<div class="feed-portfolio-empty">Aucun portfolio disponible pour le moment.</div>';
          return;
        }
        container.innerHTML = '';
        projects.forEach((p: any) => {
          const img = p.image1 || p.image2 || p.image3 || p.image4;
          const username = p.created_by?.username || 'Utilisateur';
          const skill = p.skills?.[0]?.name_fr || '';
          const color = this.colorFor(username);
          const initials = username.slice(0, 2).toUpperCase();
          const slug = p.created_by?.profile?.slug || username;

          const card = document.createElement('div');
          card.className = 'feed-portfolio-card';
          card.dataset['projectId'] = p.id;
          card.innerHTML = `
            <div class="fp-img-wrap">
              ${img
                ? `<img src="${img}" alt="${username}" loading="lazy">`
                : `<div class="fp-img-placeholder" style="background:${color}">${initials}</div>`
              }
              <div class="fp-overlay">
                <button class="fp-btn btn-voir-profil" data-slug="${slug}">Voir profil →</button>
              </div>
            </div>
            <div class="fp-info">
              <div class="fp-avatar" style="background:${color}">${initials}</div>
              <div class="fp-info-text">
                <div class="fp-username">${username}</div>
                ${skill ? `<div class="fp-skill">${skill}</div>` : ''}
              </div>
              <div class="fp-top-actions">
                <button class="fp-like-btn" data-project="${p.id}" title="J'aime">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span class="fp-like-count" id="fp-likes-${p.id}">0</span>
                </button>
              </div>
            </div>
            ${p.description ? (() => {
              const full = p.description;
              const short = full.slice(0, 80);
              const hasMore = full.length > 80;
              const fullEsc = full.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
              return `<p class="fp-desc" id="fp-pdesc-${p.id}">${short}${hasMore ? `… <button class="fc-read-more" onclick="var el=document.getElementById('fp-pdesc-${p.id}');el.innerHTML='${fullEsc}';el.style.overflow='visible'" style="font-size:.78rem">Lire la suite →</button>` : ''}</p>`;
            })() : ''}
            <div class="fp-actions-row">
              <button class="fp-contact-btn fp-btn-contacter" data-slug="${slug}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Contacter
              </button>
            </div>
            <div class="fp-comments-section">
              <div class="fp-comments-header">
                <span class="fp-comments-count" id="fp-count-${p.id}">0 commentaire</span>
              </div>
              <div class="fp-comments-list" id="fp-comments-list-${p.id}" data-loaded="0" data-total="0" data-showing="2"></div>
              <button class="fp-show-more" id="fp-show-more-${p.id}" style="display:none" data-project="${p.id}">Voir plus</button>
              <div class="fp-comment-form">
                <input class="fp-comment-input" id="fp-input-${p.id}" placeholder="Commenter…" />
                <button class="fp-comment-send" data-project="${p.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          `;
          container.appendChild(card);
          this.loadProjectComments(p.id);
        });
      },
      error: () => {
        if (container) container.innerHTML = '<div class="feed-portfolio-empty">Erreur de chargement.</div>';
      }
    });
  }

  private timeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 172800) return 'hier';
    return `il y a ${Math.floor(diff / 86400)} jours`;
  }

  private colorFor(name: string): string {
    const colors = ['#1B3C6B','#EA580C','#16A34A','#7C3AED','#D97706','#0891B2','#DC2626'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
    return colors[h];
  }
}
