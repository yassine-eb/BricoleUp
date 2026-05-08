import { Component, OnInit, signal, HostListener, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Annonce, Categorie, PaginatedResponse } from '../../core/models/ad.model';
import { HomeResponse } from '../../core/models/home.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    :host { display: block; }

    .btn { position: relative; overflow: hidden; display: inline-flex; align-items: center; justify-content: center;
      border: 0; border-radius: 50px; padding: 14px 36px; font: 600 1rem "DM Sans", system-ui, sans-serif;
      cursor: pointer; transition: transform .2s ease, filter .2s ease, background .25s ease, color .25s ease; white-space: nowrap; }
    .btn:hover { filter: brightness(1.1); transform: scale(1.02); }
    .btn::after { content: ""; position: absolute; inset: 0;
      background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,.34) 45%, transparent 72%);
      transform: translateX(-120%); transition: transform .55s ease; }
    .btn:hover::after { transform: translateX(120%); }
    .btn-primary { background: #1B3C6B; color: #fff; }
    .btn-primary:hover { background: #F97316; }
    .btn-orange { background: #F97316; color: #fff; }
    .btn-green { background: #4ADE80; color: #fff; }

    .section-title { position: relative; margin-bottom: 36px; text-align: center;
      font-size: clamp(1.8rem,4vw,2.35rem); font-family: "Poppins",system-ui,sans-serif; font-weight: 800; color: #1B3C6B; }
    .section-title::after { content: ""; display: block; width: 72px; height: 4px; margin: 16px auto 0;
      border-radius: 999px; background: linear-gradient(90deg,#1B3C6B,#F97316); box-shadow: 0 8px 20px rgba(249,115,22,.25); }

    .highlight { position: relative; overflow: hidden; display: inline-block; border-radius: 6px;
      padding: 2px 12px; color: #fff; box-shadow: 0 10px 24px rgba(15,23,42,.12);
      transform: rotate(-1deg); vertical-align: baseline; }
    .highlight::after { content: ""; position: absolute; top: -30%; bottom: -30%; width: 34px;
      background: rgba(255,255,255,.32); transform: translateX(-90px) rotate(18deg);
      animation: badgeShine 3.2s ease-in-out infinite; }
    @keyframes badgeShine {
      0%,42% { transform: translateX(-90px) rotate(18deg); }
      62%,100% { transform: translateX(180px) rotate(18deg); }
    }
    .highlight.green { background: #4ADE80; }
    .highlight.orange { background: #F97316; }
    .highlight.blue { background: #1B3C6B; }

    .reveal { opacity: 0; transform: translateY(24px); transition: opacity .5s ease, transform .5s ease; }
    .reveal.is-visible { opacity: 1; transform: translateY(0); }

    /* Store wave */
    .store-wave { position: relative; padding: 66px 48px; background: #1B3C6B; color: #fff; }
    .wave { position: absolute; left: 0; width: 100%; height: 54px; color: #fff; pointer-events: none; }
    .wave-top { top: -1px; }
    .wave-bottom { bottom: -1px; transform: rotate(180deg); }
    .store-content { position: relative; z-index: 1; display: flex; justify-content: center; gap: 44px; text-align: center; }
    .store-btn { border: 2px solid #fff; border-radius: 50px; padding: 12px 28px; background: transparent;
      color: #fff; font-family: "Poppins",system-ui,sans-serif; font-weight: 700;
      transition: background .2s ease, color .2s ease, transform .2s ease; cursor: pointer; display: inline-block; }
    .store-btn:hover { background: #fff; color: #1B3C6B; transform: scale(1.02); }
    .stars { color: #FBBF24; letter-spacing: 1px; margin-top: 13px; }
    .score { color: #fff; font-weight: 800; margin-top: 3px; }
    .reviews-count { color: rgba(255,255,255,.7); font-size: .8rem; }

    /* Cards */
    .cards-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; width: min(1100px,100%); margin: 0 auto; }
    .card { overflow: hidden; border-radius: 12px; background: #fff; box-shadow: 0 8px 30px rgba(27,60,107,.1);
      transition: transform .25s ease, box-shadow .25s ease; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(27,60,107,.15); }
    .card-body { padding: 18px; }
    .card-header { display: flex; align-items: center; gap: 12px; }
    .avatar { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px;
      border-radius: 50%; color: #1B3C6B; font-weight: 800; }
    .avatar.orange { background: #FED7AA; }
    .avatar.green { background: #BBF7D0; }
    .avatar.blue { background: #BFDBFE; }
    .name-label { color: #0F172A; font-weight: 800; font-size: .9rem; }
    .city { color: #64748B; font-size: .8rem; }
    .request-title { margin: 12px 0; color: #1B3C6B; font-family: "Poppins",system-ui,sans-serif; font-weight: 800; line-height: 1.35; }
    .placeholder-img { display: flex; align-items: center; justify-content: center; width: 100%; height: 140px;
      background: #E2E8F0; font-size: 2.5rem; }
    .description { display: -webkit-box; min-height: 45px; margin: 14px 0; overflow: hidden;
      color: #64748B; font-size: .85rem; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .description.three { min-height: 67px; -webkit-line-clamp: 3; }
    .response-badge { display: inline-flex; border-radius: 50px; padding: 4px 10px;
      background: #DCFCE7; color: #16A34A; font-size: .78rem; font-weight: 800; }
    .center-action { margin-top: 34px; text-align: center; }
    .rating { color: #FBBF24; font-size: .82rem; letter-spacing: -1px; }
    .note { color: #0F172A; font-weight: 800; font-size: .86rem; }
    .provider-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; margin-top: 2px; }
    .role-badge { border-radius: 50px; padding: 3px 9px; font-size: .72rem; font-weight: 800; }
    .role-badge.pro { background: #EFF6FF; color: #1B3C6B; }
    .role-badge.person { background: #FFF7ED; color: #F97316; }
    .time-label { color: #64748B; font-size: .78rem; font-style: italic; }

    /* Steps */
    .steps-section { background: #FFF7ED; }
    .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; margin-top: 10px; }
    .step { text-align: center; }
    .step-icon { display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px;
      margin-bottom: 18px; border: 3px solid #F97316; border-radius: 50%; background: #fff; font-size: 2rem; }
    .step h3 { margin: 0 0 8px; color: #1B3C6B; font-size: 1.02rem; font-family: "Poppins",system-ui,sans-serif; font-weight: 800; }
    .step p { max-width: 280px; margin: 0 auto; color: #64748B; }

    /* Pro section */
    .pro-section { background: #fff; text-align: center; }
    .pro-logo { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 10px;
      background: linear-gradient(105deg,#1B3C6B,#2563EB 56%,#F97316); background-clip: text;
      -webkit-background-clip: text; color: transparent;
      font-family: "Poppins",system-ui,sans-serif; font-size: 1.8rem; font-weight: 800; }
    .pro-pill { border-radius: 6px; padding: 2px 10px; background: #F97316; color: #fff; font-size: .9rem; }
    .pro-subtitle { margin: 0 0 32px; color: #64748B; }
    .pro-columns { display: grid; grid-template-columns: repeat(3,1fr); margin: 0 auto 32px; text-align: left; }
    .pro-col { padding: 24px; border-right: 1px solid #E2E8F0; }
    .pro-col:last-child { border-right: 0; }
    .pro-col h3 { margin: 0 0 16px; font-size: 1.15rem; color: #1B3C6B; font-family: "Poppins",system-ui,sans-serif; font-weight: 800; }
    .pro-col ul { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
    .pro-col li { color: #0F172A; font-size: .9rem; }
    .pro-col li::before { content: "✓"; margin-right: 9px; color: #F97316; font-weight: 900; }
    .pro-actions { display: flex; justify-content: center; align-items: center; gap: 24px; }
    .learn-link { color: #F97316; font-weight: 800; text-decoration: none; }
    .learn-link:hover { text-decoration: underline; }

    /* App section */
    .app-section { background: #F8FAFC; }
    .app-layout { display: flex; align-items: center; justify-content: center; gap: 72px; }
    .phones { display: flex; align-items: center; gap: 8px; }
    .phone { position: relative; display: flex; align-items: center; justify-content: center;
      width: 120px; height: 220px; border: 8px solid #0f2647; border-radius: 20px; background: #1B3C6B;
      box-shadow: 0 8px 32px rgba(27,60,107,.25); color: #fff;
      font-family: "Poppins",system-ui,sans-serif; font-size: .9rem; font-weight: 800; }
    .phone::before { content: ""; position: absolute; top: 10px; width: 38px; height: 4px;
      border-radius: 99px; background: rgba(255,255,255,.45); }
    .phone:first-child { transform: rotate(-5deg); }
    .phone:last-child { transform: rotate(5deg); background: #F97316; }
    .app-buttons { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
    .black-store { border-radius: 10px; padding: 10px 20px; background: #000; color: #fff;
      font-weight: 800; transition: transform .2s ease, filter .2s ease; text-decoration: none; display: inline-block; }
    .black-store:hover { filter: brightness(1.1); transform: scale(1.02); }
    .app-score { color: #1B3C6B; font-weight: 800; font-size: 1.05rem; }

    /* Project / testimonial */
    .split-layout { display: grid; grid-template-columns: repeat(2,1fr); gap: 40px; align-items: start; }
    .local-title { margin-bottom: 22px; font-size: 1.65rem; letter-spacing: .01em;
      color: #1B3C6B; font-family: "Poppins",system-ui,sans-serif; font-weight: 800; }
    .double-underline { text-decoration-line: underline; text-decoration-style: double;
      text-decoration-color: #F97316; text-underline-offset: 5px; }
    .project-cards { display: grid; grid-template-columns: repeat(2,1fr); gap: 18px; }
    .project-card { position: relative; display: flex; align-items: center; justify-content: center;
      height: 160px; overflow: hidden; border-radius: 12px; color: #fff; font-size: 2.5rem;
      box-shadow: 0 8px 30px rgba(27,60,107,.1); }
    .project-card.car { background: #FED7AA; }
    .project-card.bath { background: #BBF7D0; }
    .project-card strong { position: absolute; right: 14px; bottom: 14px; left: 14px;
      color: #fff; font-size: .95rem; font-weight: 800; line-height: 1.25; text-shadow: 0 2px 8px rgba(15,23,42,.35); }
    .article-card { border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; background: #fff;
      box-shadow: 0 8px 30px rgba(27,60,107,.1); }
    .article-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
    .article-info { flex: 1; }
    .article-score { border-radius: 50px; padding: 4px 10px; background: #DCFCE7; color: #16A34A; font-weight: 800; font-size: .82rem; }
    .quote-mark { margin-bottom: -16px; color: #F97316; font-family: "Poppins",system-ui,sans-serif; font-size: 4rem; line-height: 1; opacity: .3; }
    blockquote { margin: 0 0 18px; color: #1B3C6B; font-size: 1.25rem; font-style: italic; font-weight: 700; line-height: 1.45; }
    .story-link { color: #F97316; font-weight: 800; text-decoration: none; }

    /* Press */
    .press-section { background: #fff; padding: 42px 48px; }
    .press-section h2 { margin-bottom: 26px; color: #64748B; font-size: 1.4rem; text-align: center;
      font-family: "Poppins",system-ui,sans-serif; font-weight: 800; }
    .press-logos { display: flex; flex-wrap: wrap; justify-content: center; gap: 28px 40px; }
    .press-logos span { color: #94A3B8; font-size: 1.3rem; font-weight: 900; letter-spacing: -.5px;
      opacity: .5; transition: color .2s ease, opacity .2s ease; cursor: default; }
    .press-logos span:hover { color: #1B3C6B; opacity: 1; }

    /* Overlay & Modals */
    .overlay { display: none; position: fixed; inset: 0; z-index: 999; background: rgba(0,0,0,.5); }
    .overlay.actif { display: block; }
    .modal { display: none; position: fixed; top: 50%; left: 50%; z-index: 1000; width: 90%; max-width: 480px;
      max-height: 90vh; overflow-y: auto; padding: 32px; border-radius: 16px; background: #fff;
      opacity: 0; transform: translate(-50%,-50%) scale(.95); transition: all .2s ease;
      box-shadow: 0 24px 80px rgba(15,23,42,.25); }
    .modal.actif { display: block; opacity: 1; transform: translate(-50%,-50%) scale(1); animation: modalPop .2s ease; }
    @keyframes modalPop {
      from { opacity: 0; transform: translate(-50%,-50%) scale(.95); }
      to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
    }
    .modal-close, .modal-back { position: absolute; top: 18px; display: inline-flex; align-items: center;
      justify-content: center; width: 34px; height: 34px; border: 0; border-radius: 50%;
      background: transparent; color: #0F172A; font-size: 1.35rem; cursor: pointer;
      transition: background .2s ease, color .2s ease; }
    .modal-close { right: 18px; }
    .modal-back { left: 18px; }
    .modal-close:hover, .modal-back:hover { background: #F8FAFC; color: #F97316; }
    .modal h2 { margin: 12px 34px 12px; background: linear-gradient(110deg,#1B3C6B,#F97316);
      background-clip: text; -webkit-background-clip: text; color: transparent; text-align: center; font-size: 1.65rem; }
    .modal-subtitle { margin: 0 auto 26px; max-width: 360px; color: #64748B; text-align: center; }
    .modal-stack { display: grid; gap: 12px; }
    .social-btn, .role-btn { display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; border: 1.5px solid #CBD5E1; border-radius: 50px; padding: 14px; background: #fff;
      color: #0F172A; font: 500 .95rem "DM Sans",system-ui,sans-serif; cursor: pointer;
      transition: background .2s ease, transform .2s ease; }
    .social-btn:hover, .role-btn:hover { background: #F8FAFC; transform: scale(1.01); }
    .social-icon { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; flex: 0 0 22px; }
    .facebook-icon { border-radius: 50%; background: #1877F2; color: #fff; font: 800 1rem Arial,sans-serif; }
    .divider-or { display: flex; align-items: center; gap: 14px; margin: 14px 0; color: #94A3B8; font-size: .86rem; }
    .divider-or::before, .divider-or::after { content: ""; flex: 1; height: 1px; background: #E2E8F0; }
    .modal-link { margin-top: 18px; text-align: center; color: #64748B; font-size: .95rem; }
    .modal-link button, .forgot-link { border: 0; background: transparent; color: #1B3C6B; font: inherit; text-decoration: underline; cursor: pointer; }
    .auth-form { display: grid; gap: 12px; }
    .input-row { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
    .field { position: relative; }
    .field input { width: 100%; border: 1.5px solid #E2E8F0; border-radius: 50px; padding: 14px 20px;
      color: #0F172A; font: .95rem "DM Sans",system-ui,sans-serif; transition: border-color .2s ease; box-sizing: border-box; }
    .field input:focus { border-color: #1B3C6B; outline: none; }
    .field label { position: absolute; top: 50%; left: 18px; padding: 0 6px; background: #fff; color: #64748B;
      pointer-events: none; transform: translateY(-50%); transition: top .18s ease, font-size .18s ease, color .18s ease; }
    .field input:focus + label, .field input:not(:placeholder-shown) + label { top: 0; color: #1B3C6B; font-size: .76rem; }
    .password-field input { padding-right: 54px; }
    .toggle-password { position: absolute; top: 50%; right: 12px; border: 0; background: transparent; font-size: 1rem; cursor: pointer; transform: translateY(-50%); }
    .checkboxes { display: grid; gap: 10px; margin: 4px 0; }
    .checkboxes label { display: flex; align-items: flex-start; gap: 10px; color: #64748B; font-size: .86rem; line-height: 1.35; }
    .checkboxes input { margin-top: 2px; accent-color: #1B3C6B; }
    .checkboxes a { color: #1B3C6B; text-decoration: underline; }
    .modal-submit { width: 100%; margin-top: 4px; padding: 14px; }
    .step-text-modal { margin: 18px 0 0; color: #64748B; text-align: center; font-size: .9rem; }

    @media (max-width: 768px) {
      .cards-grid, .steps-grid, .pro-columns, .split-layout, .project-cards { grid-template-columns: 1fr; }
      .store-content, .pro-actions { flex-direction: column; align-items: center; gap: 20px; }
      .app-layout { flex-direction: column; gap: 30px; }
      .pro-col { border-right: 0; border-bottom: 1px solid #E2E8F0; }
      .pro-col:last-child { border-bottom: 0; }
      .input-row { grid-template-columns: 1fr; }
      .press-section { padding: 42px 22px; }
    }
  `],
  template: `
    <!-- ===== HERO ===== -->
    <section class="hero reveal" style="display:flex;align-items:center;gap:56px;min-height:480px;padding:76px 48px;background:#fff;overflow:hidden;">
      <div style="flex:1 1 50%;">
        <div style="width:100%;height:390px;border-radius:16px;box-shadow:0 18px 50px rgba(27,60,107,.22);background:#E2E8F0;display:flex;align-items:center;justify-content:center;font-size:6rem;">🔧</div>
      </div>
      <div style="flex:1 1 50%;">
        <h1 style="max-width:560px;margin-bottom:18px;background:linear-gradient(115deg,#1B3C6B 0%,#2563EB 46%,#F97316 100%);background-clip:text;-webkit-background-clip:text;color:transparent;font-size:clamp(2.05rem,4vw,2.6rem);font-family:Poppins,system-ui,sans-serif;font-weight:800;line-height:1.18;">
          Prestations de services<br>et artisans près de chez vous
        </h1>
        <p style="max-width:500px;margin:0 0 28px;color:#64748B;font-size:1.05rem;">Plus de 500 000 particuliers et professionnels partout en France</p>
        <a class="btn btn-primary" routerLink="/auth/register">Créer un compte</a>
      </div>
    </section>

    <!-- ===== STORE WAVE ===== -->
    <section class="store-wave reveal">
      <svg class="wave wave-top" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,0H1440V42C1190,82 980,18 735,43C483,69 258,77 0,33Z" fill="currentColor"></path>
      </svg>
      <div class="store-content">
        <div>
          <a class="store-btn" href="#">▶ Google Play</a>
          <div class="stars">★★★★½</div>
          <div class="score">4,6/5</div>
          <div class="reviews-count">Calculé à partir de 47 802 avis</div>
        </div>
        <div>
          <a class="store-btn" href="#"> App Store</a>
          <div class="stars">★★★★½</div>
          <div class="score">4,6/5</div>
          <div class="reviews-count">Calculé à partir de 47 802 avis</div>
        </div>
      </div>
      <svg class="wave wave-bottom" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,0H1440V42C1190,82 980,18 735,43C483,69 258,77 0,33Z" fill="currentColor"></path>
      </svg>
    </section>

    <!-- ===== DERNIÈRES DEMANDES ===== -->
    <section style="padding:76px 48px;background:#F0FDF4;overflow:hidden;" class="reveal">
      <div style="width:min(1100px,100%);margin:0 auto;">
        <h2 class="section-title">Les dernières <span class="highlight green">demandes</span></h2>
        <div *ngIf="loading" style="text-align:center;padding:40px;">
          <p>Loading latest requests...</p>
        </div>
        <div *ngIf="error" style="text-align:center;color:#dc2626;padding:40px;">
          <p>{{ error }}</p>
        </div>
        <div class="cards-grid" *ngIf="!loading && !error">
          <article class="card reveal" *ngFor="let demande of latest_demandes; let i = index" [style.transition-delay]="i * 100 + 'ms'">
            <div class="placeholder-img"><span>{{ demande.categorie?.icone || '📝' }}</span></div>
            <div class="card-body">
              <div class="card-header">
                <span class="avatar blue">{{ demande.client?.first_name?.charAt(0) || 'U' }}{{ demande.client?.last_name?.charAt(0) || 'N' }}</span>
                <div>
                  <div class="name-label">{{ demande.client?.first_name || 'User' }} {{ demande.client?.last_name || '' }}</div>
                  <div class="city">{{ demande.localisation }}</div>
                </div>
              </div>
              <div class="request-title">{{ demande.titre }}</div>
              <p class="description">{{ demande.description }}</p>
              <span class="response-badge">{{ demande.urgence ? 'URGENT' : 'Actif' }}</span>
            </div>
          </article>
        </div>
        <div class="center-action">
          <a class="btn btn-green" routerLink="/annonces">Voir toutes les demandes</a>
        </div>
      </div>
    </section>

    <!-- ===== PRESTATAIRES ===== -->
    <section style="padding:76px 48px;background:#fff;overflow:hidden;" class="reveal">
      <div style="width:min(1100px,100%);margin:0 auto;">
        <h2 class="section-title">Ils <span class="highlight orange">répondent</span> à vos demandes</h2>
        <div *ngIf="loading" style="text-align:center;padding:40px;">
          <p>Loading providers...</p>
        </div>
        <div *ngIf="error" style="text-align:center;color:#dc2626;padding:40px;">
          <p>{{ error }}</p>
        </div>
        <div class="cards-grid" *ngIf="!loading && !error">
          <article class="card reveal" *ngFor="let offre of latest_offres; let i = index" [style.transition-delay]="i * 100 + 'ms'">
            <div class="placeholder-img"><span>{{ offre.categorie?.icone || '⭐' }}</span></div>
            <div class="card-body">
              <div class="card-header">
                <span class="avatar blue">{{ offre.client?.first_name?.charAt(0) || 'U' }}{{ offre.client?.last_name?.charAt(0) || 'N' }}</span>
                <div>
                  <div class="name-label">{{ offre.client?.first_name || 'User' }} {{ offre.client?.last_name || '' }}</div>
                  <div class="provider-meta">
                    <span class="rating">★★★★★</span>
                    <span class="note">4,8/5</span>
                    <span class="role-badge pro">{{ offre.client?.profile?.account_type || 'Artisan' }}</span>
                  </div>
                  <div class="city">{{ offre.localisation }}</div>
                </div>
              </div>
              <p class="description three">{{ offre.description }}</p>
              <div class="time-label">Il y a quelques minutes</div>
            </div>
          </article>
        </div>
        <div class="center-action">
          <a class="btn btn-orange" routerLink="/annonces">Voir tous les prestataires</a>
        </div>
      </div>
    </section>

    <!-- ===== COMMENT ÇA MARCHE ===== -->
    <section class="steps-section reveal" style="padding:76px 48px;overflow:hidden;">
      <div style="width:min(1100px,100%);margin:0 auto;">
        <h2 class="section-title"><span class="highlight orange">Particuliers,</span> trouvez le bon artisan avec BricoleUp !</h2>
        <div class="steps-grid">
          <div class="step reveal" style="transition-delay:0ms">
            <div class="step-icon">📋</div>
            <h3>1. Je dépose ma demande</h3>
            <p>En 2 minutes, décris ton projet et ton budget</p>
          </div>
          <div class="step reveal" style="transition-delay:100ms">
            <div class="step-icon">💬</div>
            <h3>2. Je reçois des devis</h3>
            <p>Des prestataires vérifiés KYC te répondent rapidement</p>
          </div>
          <div class="step reveal" style="transition-delay:200ms">
            <div class="step-icon">⭐</div>
            <h3>3. Je valide et je note</h3>
            <p>Paiement sécurisé, fonds libérés après validation</p>
          </div>
        </div>
        <div class="center-action">
          <a class="btn btn-orange" routerLink="/annonces/create">Je dépose ma demande</a>
        </div>
      </div>
    </section>

    <!-- ===== PRO ===== -->
    <section class="pro-section reveal" style="padding:76px 48px;overflow:hidden;">
      <div style="width:min(1100px,100%);margin:0 auto;">
        <div class="pro-logo">bricoleup <span class="pro-pill">pro</span></div>
        <p class="pro-subtitle">Professionnels, développez votre activité avec BricoleUp Pro</p>
        <div class="pro-columns">
          <div class="pro-col reveal" style="transition-delay:0ms">
            <h3>Trouvez des clients</h3>
            <ul>
              <li>500 000+ membres actifs</li>
              <li>Des milliers de demandes chaque jour</li>
              <li>Partout en France</li>
              <li>Mise en relation instantanée</li>
            </ul>
          </div>
          <div class="pro-col reveal" style="transition-delay:100ms">
            <h3>Développez votre visibilité</h3>
            <ul>
              <li>Profil référencé sur Google</li>
              <li>Collecte d'avis clients vérifiés</li>
              <li>Badge "Pro Vérifié" affiché</li>
              <li>Boost d'annonce disponible</li>
            </ul>
          </div>
          <div class="pro-col reveal" style="transition-delay:200ms">
            <h3>Gérez votre activité</h3>
            <ul>
              <li>Création et envoi de devis PDF</li>
              <li>Paiement sécurisé en escrow</li>
              <li>Suivi de votre chiffre d'affaires</li>
              <li>Dashboard prestataire complet</li>
            </ul>
          </div>
        </div>
        <div class="pro-actions">
          <a class="btn btn-primary" routerLink="/auth/register">Je m'inscris</a>
          <a class="learn-link" href="#">En savoir plus →</a>
        </div>
      </div>
    </section>

    <!-- ===== APP MOBILE ===== -->
    <section class="app-section reveal" style="padding:76px 48px;overflow:hidden;">
      <div style="width:min(1100px,100%);margin:0 auto;">
        <h2 class="section-title">Téléchargez notre <span class="highlight blue">application</span> mobile</h2>
        <div class="app-layout">
          <div class="phones">
            <div class="phone">BricoleUp</div>
            <div class="phone">BricoleUp</div>
          </div>
          <div>
            <div class="app-buttons">
              <a class="black-store" href="#"> App Store</a>
              <a class="black-store" href="#">▶ Google Play</a>
            </div>
            <div class="stars" style="color:#FBBF24;">★★★★½</div>
            <div class="app-score">4,6/5</div>
            <div style="color:#64748B;font-size:.8rem;">Calculé à partir de 113 802 avis</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== PROJETS / TÉMOIGNAGE ===== -->
    <section style="padding:76px 48px;background:#fff;overflow:hidden;" class="reveal">
      <div style="width:min(1100px,100%);margin:0 auto;" class="split-layout">
        <div>
          <h2 class="local-title">Les <span class="double-underline">projets</span> à la Une</h2>
          <div class="project-cards">
            <div class="project-card car reveal" style="transition-delay:0ms">🚗<strong>J'entretiens mon véhicule</strong></div>
            <div class="project-card bath reveal" style="transition-delay:100ms">🚿<strong>Je rénove ma salle de bain</strong></div>
          </div>
        </div>
        <div>
          <h2 class="local-title">Le dernier <span class="highlight blue">article</span> publié</h2>
          <article class="article-card reveal" *ngIf="latest_annonce as a; else noAnnonce">
            <div class="article-header">
              <span class="avatar orange" style="color:#fff">{{ (a.created_by?.username || 'U') | slice:0:2 | uppercase }}</span>
              <div class="article-info">
                <div class="name-label">{{ a.created_by?.username || 'Utilisateur' }}</div>
                <div class="city">{{ a.category?.name_fr || 'Annonce' }} · {{ a.city?.name_fr || '—' }}</div>
              </div>
              <span class="article-score">#{{ a.id }}</span>
            </div>
            <div class="quote-mark">"</div>
            <blockquote>{{ a.description }}</blockquote>
            <a class="story-link" [routerLink]="['/annonces', a.id]">Voir l'annonce →</a>
          </article>
          <ng-template #noAnnonce>
            <article class="article-card reveal">
              <div class="article-header">
                <span class="avatar orange" style="color:#fff">BU</span>
                <div class="article-info">
                  <div class="name-label">BricoleUp</div>
                  <div class="city">Aucune annonce pour le moment</div>
                </div>
                <span class="article-score">â€”</span>
              </div>
              <div class="quote-mark">"</div>
              <blockquote>Revenez plus tard pour dÃ©couvrir les derniÃ¨res annonces publiÃ©es.</blockquote>
              <a class="story-link" routerLink="/annonces">Voir les annonces â†’</a>
            </article>
          </ng-template>
        </div>
      </div>
    </section>

    <!-- ===== PRESSE ===== -->
    <section class="press-section reveal">
      <div style="width:min(1100px,100%);margin:0 auto;">
        <h2>Ils parlent de nous</h2>
        <div class="press-logos">
          <span>TF1</span><span>RTL</span><span>France Info</span>
          <span>BFM TV</span><span>Le Monde</span><span>20 Minutes</span>
        </div>
      </div>
    </section>

    <!-- ===== OVERLAY ===== -->
    <div class="overlay" [class.actif]="modalActif !== null" (click)="fermerModal()"></div>

    <!-- ===== MODAL A — Rejoignez-nous ===== -->
    <div class="modal" [class.actif]="modalActif === 'a'" role="dialog" aria-modal="true">
      <button class="modal-close" type="button" (click)="fermerModal()">×</button>
      <h2>Rejoignez-nous !</h2>
      <p class="modal-subtitle">Les habitants et professionnels de votre quartier répondent à tous vos besoins.</p>
      <div class="modal-stack">
        <button class="social-btn" type="button"><span class="social-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.04h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.43z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.34l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.75-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.41 13.98A6 6 0 0 1 6.1 12c0-.69.11-1.35.31-1.98V7.43H3.07A10 10 0 0 0 2 12c0 1.61.39 3.13 1.07 4.57l3.34-2.59z"/><path fill="#EA4335" d="M12 5.9c1.47 0 2.79.51 3.83 1.5l2.86-2.86C16.96 2.93 14.7 2 12 2a10 10 0 0 0-8.93 5.43l3.34 2.59C7.2 7.65 9.4 5.9 12 5.9z"/></svg></span>Se connecter avec Google</button>
        <button class="social-btn" type="button"><span class="social-icon facebook-icon" aria-hidden="true">f</span>Continuer avec Facebook</button>
        <div class="divider-or">ou</div>
        <button class="social-btn" type="button" (click)="ouvrirModal('c')"><span class="social-icon">👤</span>M'inscrire avec un e-mail</button>
      </div>
      <div class="modal-link">Déjà inscrit ? <button type="button" (click)="ouvrirModal('b')">Me connecter</button></div>
    </div>

    <!-- ===== MODAL B — Connexion ===== -->
    <div class="modal" [class.actif]="modalActif === 'b'" role="dialog" aria-modal="true">
      <button class="modal-back" type="button" (click)="ouvrirModal('a')">←</button>
      <button class="modal-close" type="button" (click)="fermerModal()">×</button>
      <h2>Contents de vous revoir !</h2>
      <div class="modal-stack">
        <button class="social-btn" type="button"><span class="social-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.04h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.43z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.34l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.75-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.41 13.98A6 6 0 0 1 6.1 12c0-.69.11-1.35.31-1.98V7.43H3.07A10 10 0 0 0 2 12c0 1.61.39 3.13 1.07 4.57l3.34-2.59z"/><path fill="#EA4335" d="M12 5.9c1.47 0 2.79.51 3.83 1.5l2.86-2.86C16.96 2.93 14.7 2 12 2a10 10 0 0 0-8.93 5.43l3.34 2.59C7.2 7.65 9.4 5.9 12 5.9z"/></svg></span>Se connecter avec Google</button>
        <button class="social-btn" type="button"><span class="social-icon facebook-icon">f</span>Continuer avec Facebook</button>
        <div class="divider-or">ou</div>
        <form class="auth-form" (submit)="$event.preventDefault()">
          <div class="field"><input type="email" placeholder="E-mail" required></div>
          <div class="field password-field">
            <input [type]="showPwd ? 'text' : 'password'" placeholder="Mot de passe" required>
            <button class="toggle-password" type="button" (click)="showPwd = !showPwd">👁</button>
          </div>
          <button class="btn btn-primary modal-submit" type="submit">Connexion</button>
        </form>
        <div class="modal-link"><a class="forgot-link" routerLink="/auth/forgot-password" (click)="fermerModal()">Mot de passe oublié ?</a></div>
      </div>
    </div>

    <!-- ===== MODAL C — Choix rôle ===== -->
    <div class="modal" [class.actif]="modalActif === 'c'" role="dialog" aria-modal="true">
      <button class="modal-back" type="button" (click)="ouvrirModal('a')">←</button>
      <button class="modal-close" type="button" (click)="fermerModal()">×</button>
      <h2>Je m'inscris en tant que :</h2>
      <div class="modal-stack">
        <button class="role-btn" type="button" (click)="ouvrirModal('d')">Particulier</button>
        <div class="divider-or">ou</div>
        <button class="role-btn" type="button" (click)="ouvrirModal('e')">Auto-entrepreneur</button>
        <button class="role-btn" type="button" (click)="ouvrirModal('f')">Entreprise</button>
      </div>
      <p class="step-text-modal">Étape 1/2</p>
    </div>

    <!-- ===== MODAL D — Inscription Particulier ===== -->
    <div class="modal" [class.actif]="modalActif === 'd'" role="dialog" aria-modal="true">
      <button class="modal-back" type="button" (click)="ouvrirModal('c')">←</button>
      <button class="modal-close" type="button" (click)="fermerModal()">×</button>
      <h2>Inscription Particulier</h2>
      <form class="auth-form" (submit)="$event.preventDefault()">
        <div class="input-row">
          <div class="field"><input type="text" placeholder=" " required><label>Prénom</label></div>
          <div class="field"><input type="text" placeholder=" " required><label>Nom</label></div>
        </div>
        <div class="field"><input type="text" placeholder=" " required><label>Adresse postale</label></div>
        <div class="field"><input type="tel" placeholder=" " required><label>Mobile</label></div>
        <div class="field"><input type="email" placeholder=" " required><label>E-mail</label></div>
        <div class="field password-field"><input type="password" placeholder=" " required><label>Mot de passe</label></div>
        <div class="checkboxes">
          <label><input type="checkbox"> Recevoir les informations de nos partenaires</label>
          <label><input type="checkbox" required> J'accepte les <a href="#">conditions générales</a></label>
        </div>
        <button class="btn btn-primary modal-submit" type="submit">M'inscrire</button>
      </form>
      <p class="step-text-modal">Étape 2/2</p>
    </div>

    <!-- ===== MODAL E — Inscription Auto-entrepreneur ===== -->
    <div class="modal" [class.actif]="modalActif === 'e'" role="dialog" aria-modal="true">
      <button class="modal-back" type="button" (click)="ouvrirModal('c')">←</button>
      <button class="modal-close" type="button" (click)="fermerModal()">×</button>
      <h2>Inscription Auto-entrepreneur</h2>
      <form class="auth-form" (submit)="$event.preventDefault()">
        <div class="input-row">
          <div class="field"><input type="text" placeholder=" " required><label>Prénom</label></div>
          <div class="field"><input type="text" placeholder=" " required><label>Nom</label></div>
        </div>
        <div class="field"><input type="text" placeholder=" " required><label>Nom commercial</label></div>
        <div class="field"><input type="text" placeholder=" " required><label>Métier</label></div>
        <div class="field"><input type="text" placeholder=" " required><label>Adresse postale</label></div>
        <div class="field"><input type="tel" placeholder=" " required><label>Mobile</label></div>
        <div class="field"><input type="email" placeholder=" " required><label>E-mail</label></div>
        <div class="field password-field"><input type="password" placeholder=" " required><label>Mot de passe</label></div>
        <div class="checkboxes">
          <label><input type="checkbox"> Recevoir les informations de nos partenaires</label>
          <label><input type="checkbox" required> J'accepte les <a href="#">conditions générales</a></label>
        </div>
        <button class="btn btn-primary modal-submit" type="submit">M'inscrire</button>
      </form>
      <p class="step-text-modal">Étape 2/2</p>
    </div>

    <!-- ===== MODAL F — Inscription Entreprise ===== -->
    <div class="modal" [class.actif]="modalActif === 'f'" role="dialog" aria-modal="true">
      <button class="modal-back" type="button" (click)="ouvrirModal('c')">←</button>
      <button class="modal-close" type="button" (click)="fermerModal()">×</button>
      <h2>Inscription Entreprise</h2>
      <form class="auth-form" (submit)="$event.preventDefault()">
        <div class="input-row">
          <div class="field"><input type="text" placeholder=" " required><label>Prénom du dirigeant</label></div>
          <div class="field"><input type="text" placeholder=" " required><label>Nom du dirigeant</label></div>
        </div>
        <div class="field"><input type="text" placeholder=" " required><label>Nom de l'entreprise</label></div>
        <div class="field"><input type="text" placeholder=" " required><label>Secteur d'activité</label></div>
        <div class="field"><input type="text" placeholder=" " required><label>Adresse du siège social</label></div>
        <div class="field"><input type="tel" placeholder=" " required><label>Mobile</label></div>
        <div class="field"><input type="email" placeholder=" " required><label>E-mail professionnel</label></div>
        <div class="field password-field"><input type="password" placeholder=" " required><label>Mot de passe</label></div>
        <div class="checkboxes">
          <label><input type="checkbox"> Recevoir les informations de nos partenaires</label>
          <label><input type="checkbox" required> J'accepte les <a href="#">conditions générales</a></label>
        </div>
        <button class="btn btn-primary modal-submit" type="submit">M'inscrire</button>
      </form>
      <p class="step-text-modal">Étape 2/2</p>
    </div>
  `,
})
export class HomeComponent implements OnInit, AfterViewInit {
  modalActif: string | null = null;
  showPwd = false;

  // Home data properties
  latest_demandes: Annonce[] = [];
  latest_offres: Annonce[] = [];
  latest_projects: any[] = [];
  latest_annonce: Annonce | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.fetchHomeData();
  }

  fetchHomeData(countryCode: string = 'FR'): void {
    this.loading = true;
    this.error = null;
    this.api.get<HomeResponse>('v1/home/', { country: countryCode }).subscribe({
      next: (data) => {
        this.latest_demandes = data.latest_demandes || [];
        this.latest_offres = data.latest_offres || [];
        this.latest_projects = data.latest_projects || [];
        this.latest_annonce = data.latest_annonce ?? null;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching home data:', error);
        this.error = 'Failed to load data from server';
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initReveal();
    }
  }

  private initReveal(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  ouvrirModal(id: string): void {
    this.modalActif = id;
    document.body.style.overflow = 'hidden';
  }

  fermerModal(): void {
    this.modalActif = null;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalActif) this.fermerModal();
  }
}
