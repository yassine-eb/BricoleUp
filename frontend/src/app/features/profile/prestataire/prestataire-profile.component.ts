import { Component, OnInit, AfterViewInit, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-prestataire-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .pp-page { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--texte); min-height: 100vh; }

    /* BANNER */
    .banner-wrap { position: relative; margin-bottom: 70px; }
    .banner { height: 200px; background: linear-gradient(135deg,#1B3C6B 0%,#7C3AED 55%,#F97316 100%); position: relative; overflow: hidden; }
    .banner-circle { position: absolute; border-radius: 50%; opacity: .12; background: #fff; }
    .banner-circle.c1 { width: 220px; height: 220px; top: -80px; left: -60px; }
    .banner-circle.c2 { width: 150px; height: 150px; top: 20px; right: 80px; }
    .banner-circle.c3 { width: 90px; height: 90px; bottom: -20px; right: 200px; }
    .banner-circle.c4 { width: 60px; height: 60px; top: 40px; left: 160px; opacity: .08; }
    .pp-section { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .profile-avatar-wrap { position: absolute; bottom: -50px; left: 40px; cursor: pointer; }
    .profile-avatar { width: 100px; height: 100px; border-radius: 50%; color: #fff; font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 28px; display: flex; align-items: center; justify-content: center; border: 4px solid #fff; box-shadow: 0 4px 20px rgba(0,0,0,.2); transition: .3s; position: relative; overflow: hidden; }
    .profile-avatar img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
    .avatar-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: .2s; font-size: 22px; }
    .profile-avatar-wrap:hover .avatar-overlay { opacity: 1; }
    .online-dot { position: absolute; bottom: 6px; right: 6px; width: 18px; height: 18px; background: #22C55E; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 0 2px rgba(34,197,94,.3); }

    /* PROFILE INFO */
    .profile-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; padding-top: 20px; }
    .profile-left { flex: 1; min-width: 260px; }
    .profile-name { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 24px; color: var(--texte); margin-bottom: 8px; }
    .profile-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
    .badge-type { background: var(--bleu-light); color: var(--bleu); }
    .badge-prestataire { background: var(--purple); color: #fff; }
    .badge-kyc { background: var(--vert-light); color: #15803D; }
    .badge-pro { background: var(--orange-light); color: var(--orange); border: 1px solid rgba(249,115,22,.2); }
    .profile-meta { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 10px; }
    .meta-pill { display: flex; align-items: center; gap: 5px; font-size: 13px; color: var(--gris); }
    .profile-bio { font-size: 14px; color: #334155; line-height: 1.65; margin-bottom: 12px; max-width: 540px; }
    .skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-chip { background: var(--orange-light); color: var(--orange); border: 1px solid rgba(249,115,22,.25); border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 500; }
    .profile-right { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; flex-shrink: 0; }
    .pp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: .2s; font-family: 'DM Sans', sans-serif; }
    .pp-btn-contact { background: var(--bleu); color: #fff; box-shadow: 0 2px 10px rgba(27,60,107,.25); }
    .pp-btn-contact:hover { background: var(--bleu-dark); transform: translateY(-1px); }
    .pp-btn-fav { background: #fff; border: 2px solid var(--border); color: var(--gris); }
    .pp-btn-fav:hover { border-color: var(--rouge); color: var(--rouge); }
    .pp-btn-fav.active { background: var(--rouge-light); border-color: var(--rouge); color: var(--rouge); }

    /* STATS */
    .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin: 24px 0; }
    .stat-card { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 18px; display: flex; align-items: center; gap: 14px; transition: .25s; cursor: default; }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(0,0,0,.09); border-color: transparent; }
    .stat-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 22px; }
    .stat-icon.jaune { background: var(--jaune-light); }
    .stat-icon.bleu { background: var(--bleu-light); }
    .stat-icon.orange { background: var(--orange-light); }
    .stat-icon.vert { background: var(--vert-light); }
    .stat-val { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 20px; color: var(--texte); line-height: 1; }
    .stat-lbl { font-size: 12px; color: var(--gris); margin-top: 3px; }

    /* TABS */
    .tabs-sticky { position: sticky; top: 64px; z-index: 90; background: #fff; border-bottom: 2px solid var(--border); margin-bottom: 24px; }
    .tabs-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; display: flex; position: relative; }
    .tab-btn { padding: 14px 20px; font-size: 14px; font-weight: 600; color: var(--gris); border: none; background: none; cursor: pointer; position: relative; transition: .2s; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
    .tab-btn:hover { color: var(--bleu); }
    .tab-btn.active { color: var(--orange); }
    .tab-count { background: var(--gris-light); color: var(--gris); border-radius: 20px; padding: 1px 7px; font-size: 11px; margin-left: 5px; }
    .tab-btn.active .tab-count { background: var(--orange-light); color: var(--orange); }
    .tab-underline { position: absolute; bottom: -2px; height: 2px; background: var(--orange); border-radius: 2px 2px 0 0; transition: left .25s, width .25s; }
    .tab-pane { display: none; max-width: 1100px; margin: 0 auto; padding: 0 24px 40px; }
    .tab-pane.active { display: block; }

    /* AVIS */
    .avis-top { display: grid; grid-template-columns: 180px 1fr; gap: 28px; background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    .avis-score { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 64px; color: var(--texte); line-height: 1; }
    .avis-stars-big { font-size: 22px; color: var(--jaune); margin: 4px 0; }
    .bar-row { display: flex; align-items: center; gap: 10px; font-size: 13px; margin-bottom: 8px; }
    .bar-lbl { width: 32px; color: var(--gris); text-align: right; flex-shrink: 0; }
    .bar-track { flex: 1; height: 8px; background: var(--gris-light); border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; background: var(--jaune); }
    .bar-num { width: 24px; color: var(--gris); font-size: 12px; }
    .avis-card { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 20px; margin-bottom: 14px; }
    .reviewer-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .reviewer-avatar { width: 42px; height: 42px; border-radius: 50%; color: #fff; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .reviewer-name { font-weight: 600; font-size: 15px; }
    .reviewer-date { font-size: 12px; color: var(--gris); }
    .reviewer-stars { margin-left: auto; color: var(--jaune); font-size: 16px; }
    .avis-comment { font-size: 14px; color: #334155; line-height: 1.7; margin-bottom: 12px; }
    .avis-reply { background: var(--bleu-light); border-left: 3px solid var(--bleu); border-radius: 0 10px 10px 0; padding: 12px 14px; }
    .reply-header { font-size: 12px; font-weight: 600; color: var(--bleu); margin-bottom: 6px; }
    .reply-text { font-size: 13px; color: #334155; line-height: 1.6; }
    .no-reviews { text-align: center; padding: 40px; color: var(--gris); }

    /* FORMULAIRE AVIS */
    .review-form-card { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .review-form-title { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 16px; color: var(--texte); }
    .stars-input { display: flex; gap: 6px; margin-bottom: 16px; }
    .star-btn { font-size: 28px; cursor: pointer; background: none; border: none; padding: 0; line-height: 1; transition: transform .15s; color: #d1d5db; }
    .star-btn.filled { color: #F59E0B; }
    .star-btn:hover { transform: scale(1.2); }
    .review-textarea { width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: var(--texte); resize: vertical; min-height: 90px; box-sizing: border-box; transition: border-color .2s; outline: none; }
    .review-textarea:focus { border-color: var(--orange); }
    .review-form-actions { display: flex; gap: 10px; margin-top: 12px; align-items: center; }
    .btn-submit-review { background: var(--orange); color: #fff; border: none; border-radius: 10px; padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: .2s; }
    .btn-submit-review:hover:not(:disabled) { background: #ea6c00; }
    .btn-submit-review:disabled { opacity: .55; cursor: not-allowed; }
    .btn-delete-review { background: none; border: 1px solid var(--rouge); color: var(--rouge); border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: .2s; }
    .btn-delete-review:hover { background: var(--rouge-light); }
    .review-msg { font-size: 13px; margin-left: 8px; }
    .review-msg.success { color: #15803D; }
    .review-msg.error { color: var(--rouge); }

    /* PORTFOLIO */
    .portfolio-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
    .portfolio-item { border-radius: 14px; overflow: hidden; aspect-ratio: 4/3; cursor: pointer; position: relative; }
    .portfolio-fake { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,.85); font-weight: 500; transition: .3s; }
    .portfolio-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: .3s; font-size: 36px; }
    .portfolio-item:hover .portfolio-overlay { background: rgba(0,0,0,.5); }
    .portfolio-item:hover .portfolio-fake { filter: brightness(.7); }
    .portfolio-label { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,.6); color: #fff; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 500; }
    .no-portfolio { text-align: center; padding: 40px; color: var(--gris); }

    /* À PROPOS */
    .apropos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-card { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 22px; margin-bottom: 16px; }
    .info-card h3 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 16px; }
    .info-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--gris-light); }
    .info-row:last-child { border-bottom: none; }
    .info-icon { width: 34px; height: 34px; border-radius: 8px; background: var(--bleu-light); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px; }
    .info-lbl { font-size: 12px; color: var(--gris); }
    .info-val { font-size: 14px; font-weight: 500; color: var(--texte); }

    /* ANNONCES */
    .annonce-card { background: #fff; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 18px; transition: .2s; }
    .annonce-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,.08); border-color: transparent; }
    .annonce-header { padding: 12px 18px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); background: var(--gris-light); }
    .type-offre { background: var(--bleu-light); color: var(--bleu); padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .type-demande { background: linear-gradient(90deg,#7C3AED,#9F67FA); color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-active { background: var(--vert-light); color: #15803D; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-left: auto; }
    .annonce-time { font-size: 12px; color: var(--gris); }
    .annonce-body { padding: 16px 18px; }
    .annonce-title { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 8px; }
    .annonce-desc { font-size: 14px; color: #334155; line-height: 1.65; }
    .annonce-meta-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; }
    .annonce-meta-item { font-size: 13px; color: var(--gris); }
    .annonce-meta-item.budget { color: var(--vert); font-weight: 600; }
    .annonce-cat { display: inline-flex; background: var(--orange-light); color: var(--orange); border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 500; margin-top: 10px; }
    .annonce-stats-row { padding: 12px 18px; background: var(--gris-light); display: flex; gap: 20px; }
    .ann-stat { font-size: 13px; color: var(--gris); }

    /* LIGHTBOX */
    .lightbox-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.9); z-index: 9999; display: none; align-items: center; justify-content: center; padding: 20px; }
    .lightbox-overlay.open { display: flex; }
    .lightbox-content { max-width: 700px; width: 100%; background: #111; border-radius: 16px; overflow: hidden; position: relative; }
    .lightbox-fake { width: 100%; height: 420px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; font-weight: 600; font-family: 'Poppins', sans-serif; }
    .lightbox-close { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,.5); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; z-index: 1; }
    .lightbox-prev, .lightbox-next { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,.5); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-size: 22px; display: flex; align-items: center; justify-content: center; transition: .2s; }
    .lightbox-prev { left: 12px; }
    .lightbox-next { right: 12px; }
    .lightbox-caption { padding: 14px; color: #ddd; font-size: 14px; text-align: center; }
    .lightbox-dots { display: flex; justify-content: center; gap: 6px; padding-bottom: 14px; }
    .lightbox-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.3); cursor: pointer; transition: .2s; }
    .lightbox-dot.active { background: #fff; }

    .pp-loading { text-align: center; padding: 80px 24px; color: var(--gris); font-size: 1rem; }
    .pp-error { text-align: center; padding: 80px 24px; color: var(--rouge); }

    @media(max-width:768px) {
      .stats-grid { grid-template-columns: repeat(2,1fr); gap:8px; }
      .profile-header { flex-direction: column; align-items:center; text-align:center; }
      .profile-right { align-items:center; }
      .apropos-grid { grid-template-columns:1fr; }
      .portfolio-grid { grid-template-columns:repeat(2,1fr); }
      .avis-top { grid-template-columns:1fr; }
      .pp-section { padding:0 14px; }
      .tabs-inner { padding:0 14px; overflow-x:auto; }
      .tab-pane { padding:0 14px 40px; }
      .tab-btn { font-size:.8rem; padding:10px 12px; }
      .action-bar { flex-direction:column; gap:8px; }
      .action-bar > button { width:100%; }
      .profile-name { font-size:1.4rem; }
    }
    @media(max-width:480px) {
      .stats-grid { grid-template-columns:1fr 1fr; }
      .portfolio-grid { grid-template-columns:1fr; }
    }
  `],
  template: `
    <div class="pp-page">
      @if (loading()) {
        <div class="pp-loading">⏳ Chargement du profil...</div>
      } @else if (error()) {
        <div class="pp-error">❌ Profil introuvable.</div>
      } @else {

        <!-- BANNER -->
        <div class="banner-wrap">
          <div class="banner">
            <div class="banner-circle c1"></div>
            <div class="banner-circle c2"></div>
            <div class="banner-circle c3"></div>
            <div class="banner-circle c4"></div>
          </div>
          <div class="pp-section">
            <div class="profile-avatar-wrap">
              <div class="profile-avatar" [style.background]="avatarBg()">
                @if (avatarUrl()) {
                  <img [src]="avatarUrl()" alt="avatar">
                } @else {
                  {{ initials() }}
                }
                <div class="avatar-overlay">📷</div>
              </div>
              <div class="online-dot"></div>
            </div>
          </div>
        </div>

        <!-- PROFILE INFO -->
        <div class="pp-section">
          <div class="profile-header">
            <div class="profile-left">
              <h1 class="profile-name">{{ prenom() }} {{ nom() }}</h1>
              <div class="profile-badges">
                <span class="badge badge-type">👤 {{ statut() === 'entreprise' ? 'Entreprise' : 'Particulier' }}</span>
                @if (type() === 'towork') {
                  <span class="badge badge-prestataire">🔨 Prestataire</span>
                }
                @if (isVerified()) {
                  <span class="badge badge-kyc">✓ KYC Vérifié</span>
                }
              </div>
              <div class="profile-meta">
                @if (city()) {
                  <span class="meta-pill">📍 {{ city() }}</span>
                }
                @if (radius()) {
                  <span class="meta-pill">📍 Rayon {{ radius() }} km</span>
                }
                @if (avgRating() > 0) {
                  <span class="meta-pill">⭐ {{ avgRating() }}/5</span>
                }
              </div>
              @if (bio()) {
                <p class="profile-bio">{{ bio() }}</p>
              }
              @if (skills().length > 0) {
                <div class="skills-wrap">
                  @for (s of skills(); track s) {
                    <span class="skill-chip">{{ s }}</span>
                  }
                </div>
              }
            </div>
            <div class="profile-right">
              <button class="pp-btn pp-btn-contact" (click)="contact()">💬 Contacter</button>
              <button class="pp-btn pp-btn-fav" [class.active]="isFav()" (click)="toggleFav()">
                {{ isFav() ? '♥ Retirer des favoris' : '♡ Ajouter aux favoris' }}
              </button>
            </div>
          </div>

          <!-- STATS -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon jaune">⭐</div>
              <div>
                <div class="stat-val">{{ avgRating() > 0 ? avgRating() : '—' }}</div>
                <div class="stat-lbl">Note moyenne</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bleu">💬</div>
              <div>
                <div class="stat-val">{{ reviewCount() }}</div>
                <div class="stat-lbl">Avis clients</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon orange">📋</div>
              <div>
                <div class="stat-val">{{ annonces().length }}</div>
                <div class="stat-lbl">Annonces</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon vert">📍</div>
              <div>
                <div class="stat-val">{{ radius() ? radius() + ' km' : '—' }}</div>
                <div class="stat-lbl">Rayon</div>
              </div>
            </div>
          </div>
        </div>

        <!-- TABS -->
        <div class="tabs-sticky" id="pp-tabs">
          <div class="tabs-inner">
            <button class="tab-btn active" (click)="switchTab('annonces', $event)">
              Annonces <span class="tab-count">{{ annonces().length }}</span>
            </button>
            <button class="tab-btn" (click)="switchTab('avis', $event)">
              Avis <span class="tab-count">{{ reviewCount() }}</span>
            </button>
            <button class="tab-btn" (click)="switchTab('portfolio', $event)">
              Portfolio <span class="tab-count">{{ projects().length }}</span>
            </button>
            <button class="tab-btn" (click)="switchTab('apropos', $event)">
              À propos
            </button>
            <div class="tab-underline" id="pp-underline"></div>
          </div>
        </div>

        <!-- TAB: ANNONCES -->
        <div class="tab-pane active" id="pp-tab-annonces">
          @if (annonces().length === 0) {
            <div style="text-align:center;padding:40px;color:var(--gris)">Aucune annonce publiée.</div>
          }
          @for (a of annonces(); track a.id) {
            <div class="annonce-card">
              <div class="annonce-header">
                @if (isOffre(a)) {
                  <span class="type-offre">⚡ Offre de service</span>
                } @else {
                  <span class="type-demande">🌐 Demande</span>
                }
                <span class="status-active">● Actif</span>
                <span class="annonce-time">{{ timeAgo(a.created_at) }}</span>
              </div>
              <div class="annonce-body">
                <div class="annonce-title">{{ a.description?.slice(0,80) }}</div>
                <p class="annonce-desc">{{ a.description }}</p>
                <div class="annonce-meta-row">
                  @if (a.city?.name_fr) {
                    <span class="annonce-meta-item">📍 {{ a.city.name_fr }}</span>
                  }
                  @if (a.budget_min || a.budget_max) {
                    <span class="annonce-meta-item budget">💰 {{ a.budget_min }}{{ a.budget_max ? ' – ' + a.budget_max : '' }} €</span>
                  }
                </div>
                @if (a.skills?.[0]) {
                  <span class="annonce-cat">{{ a.skills[0].name_fr }}</span>
                }
              </div>
              <div class="annonce-stats-row">
                <span class="ann-stat">👁 {{ a.views || 0 }} vues</span>
                <span class="ann-stat">💬 {{ a.messages_sent || 0 }} réponses</span>
              </div>
            </div>
          }
        </div>

        <!-- TAB: AVIS -->
        <div class="tab-pane" id="pp-tab-avis">

          <!-- FORMULAIRE DE SOUMISSION -->
          @if (isLoggedIn() && !isOwnProfile()) {
            <div class="review-form-card">
              <div class="review-form-title">✍️ Laisser un avis</div>
              <div class="stars-input">
                @for (s of [1,2,3,4,5]; track s) {
                  <button class="star-btn" [class.filled]="s <= (hoverStar() || reviewRating())"
                    (mouseenter)="hoverStar.set(s)" (mouseleave)="hoverStar.set(0)"
                    (click)="reviewRating.set(s)" type="button">★</button>
                }
              </div>
              <textarea class="review-textarea" [(ngModel)]="reviewComment"
                placeholder="Partagez votre expérience (optionnel)…" rows="3"></textarea>
              <div class="review-form-actions">
                <button class="btn-submit-review" [disabled]="reviewRating() === 0 || reviewSubmitting()"
                  (click)="submitReview()">
                  {{ reviewSubmitting() ? 'Envoi…' : 'Publier l\'avis' }}
                </button>
                @if (myExistingReview()) {
                  <button class="btn-delete-review" (click)="deleteReview()">Supprimer mon avis</button>
                }
                @if (reviewMsg()) {
                  <span class="review-msg" [class.success]="reviewMsgOk()" [class.error]="!reviewMsgOk()">
                    {{ reviewMsg() }}
                  </span>
                }
              </div>
            </div>
          }

          @if (reviews().length > 0) {
            <div class="avis-top">
              <div style="text-align:center">
                <div class="avis-score">{{ avgRating() }}</div>
                <div class="avis-stars-big">{{ starsOf(avgRating()) }}</div>
                <div style="font-size:13px;color:var(--gris)">sur {{ reviewCount() }} avis</div>
              </div>
              <div>
                @for (bar of ratingData(); track bar.star) {
                  <div class="bar-row">
                    <span class="bar-lbl">{{ bar.star }}★</span>
                    <div class="bar-track"><div class="bar-fill" [style.width.%]="bar.percent"></div></div>
                    <span class="bar-num">{{ bar.count }}</span>
                  </div>
                }
              </div>
            </div>
          }
          @if (reviews().length === 0) {
            <div class="no-reviews">Aucun avis pour le moment.</div>
          }
          @for (r of reviews(); track r.id) {
            <div class="avis-card">
              <div class="reviewer-row">
                <div class="reviewer-avatar" [style.background]="avatarColorFor(r.reviewer?.username)">
                  {{ (r.reviewer?.username || 'U').slice(0,2).toUpperCase() }}
                </div>
                <div>
                  <div class="reviewer-name">{{ r.reviewer?.username }}</div>
                  <div class="reviewer-date">{{ formatDate(r.timestamp) }}</div>
                </div>
                <div class="reviewer-stars">{{ starsOf(r.rating) }}</div>
              </div>
              @if (r.comment) {
                <p class="avis-comment">{{ r.comment }}</p>
              }
            </div>
          }
        </div>

        <!-- TAB: PORTFOLIO -->
        <div class="tab-pane" id="pp-tab-portfolio">
          @if (projects().length === 0) {
            <div class="no-portfolio">Aucune réalisation publiée.</div>
          }
          <div class="portfolio-grid">
            @for (p of projects(); track p.id; let i = $index) {
              <div class="portfolio-item" (click)="openLightbox(i)">
                @if (p.image1) {
                  <img [src]="p.image1" alt="" style="width:100%;height:100%;object-fit:cover">
                } @else {
                  <div class="portfolio-fake" [style.background]="portfolioGradient(i)">
                    <span style="font-size:32px">🔧</span>
                    <span>{{ p.description?.slice(0,30) }}</span>
                  </div>
                }
                <div class="portfolio-overlay">🔍</div>
                @if (p.skills?.[0]) {
                  <span class="portfolio-label">{{ p.skills[0].name_fr }}</span>
                }
              </div>
            }
          </div>
        </div>

        <!-- TAB: À PROPOS -->
        <div class="tab-pane" id="pp-tab-apropos">
          <div class="apropos-grid">
            <div>
              <div class="info-card">
                <h3>ℹ️ Informations</h3>
                @if (city()) {
                  <div class="info-row">
                    <div class="info-icon">📍</div>
                    <div><div class="info-lbl">Localisation</div><div class="info-val">{{ city() }}</div></div>
                  </div>
                }
                <div class="info-row">
                  <div class="info-icon">💼</div>
                  <div><div class="info-lbl">Type</div><div class="info-val">{{ type() === 'towork' ? 'Prestataire' : 'Client' }}</div></div>
                </div>
                <div class="info-row">
                  <div class="info-icon">🛡</div>
                  <div>
                    <div class="info-lbl">Vérification KYC</div>
                    <div class="info-val" [style.color]="isVerified() ? '#15803D' : 'var(--gris)'">
                      {{ isVerified() ? 'Identité vérifiée ✓' : 'Non vérifié' }}
                    </div>
                  </div>
                </div>
                @if (radius()) {
                  <div class="info-row">
                    <div class="info-icon">📡</div>
                    <div><div class="info-lbl">Rayon d'intervention</div><div class="info-val">{{ radius() }} km</div></div>
                  </div>
                }
              </div>
            </div>
            <div>
              @if (skills().length > 0) {
                <div class="info-card">
                  <h3>🛠 Compétences</h3>
                  <div class="skills-wrap" style="margin-top:8px">
                    @for (s of skills(); track s) {
                      <span class="skill-chip">{{ s }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- LIGHTBOX -->
        <div class="lightbox-overlay" [class.open]="lightboxOpen()" (click)="lightboxBgClose($event)">
          <div class="lightbox-content" id="pp-lightbox-content">
            <button class="lightbox-close" (click)="closeLightbox()">✕</button>
            <button class="lightbox-prev" (click)="lightboxNav(-1)">‹</button>
            <button class="lightbox-next" (click)="lightboxNav(1)">›</button>
            <div class="lightbox-fake" [style.background]="portfolioGradient(lightboxIndex())">
              {{ projects()[lightboxIndex()]?.description?.slice(0,60) || 'Réalisation' }}
            </div>
            <div class="lightbox-caption">Portfolio — {{ prenom() }} {{ nom() }}</div>
            <div class="lightbox-dots">
              @for (p of projects(); track p.id; let i = $index) {
                <div class="lightbox-dot" [class.active]="i === lightboxIndex()" (click)="lightboxIndex.set(i)"></div>
              }
            </div>
          </div>
        </div>

      }
    </div>
  `,
})
export class PrestataireProfileComponent implements OnInit, AfterViewInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);
  private auth   = inject(AuthService);

  loading  = signal(true);
  error    = signal(false);

  prenom     = signal('');
  nom        = signal('');
  city       = signal('');
  bio        = signal('');
  type       = signal('');
  statut     = signal('');
  radius     = signal<number|null>(null);
  skills     = signal<string[]>([]);
  isVerified = signal(false);
  avatarUrl  = signal('');
  avatarBg   = signal('linear-gradient(135deg,#1B3C6B,#7C3AED)');

  avgRating   = signal(0);
  reviewCount = signal(0);
  ratingData  = signal<any[]>([]);
  reviews     = signal<any[]>([]);
  annonces    = signal<any[]>([]);
  projects    = signal<any[]>([]);
  isFav       = signal(false);
  profileSlug = signal('');

  lightboxOpen  = signal(false);
  lightboxIndex = signal(0);

  initials = signal('?');

  // formulaire d'avis
  reviewRating     = signal(0);
  hoverStar        = signal(0);
  reviewComment    = '';
  reviewSubmitting = signal(false);
  reviewMsg        = signal('');
  reviewMsgOk      = signal(false);
  myExistingReview = signal<any>(null);
  isLoggedIn       = signal(false);
  isOwnProfile     = signal(false);
  currentUserSlug  = signal('');

  private gradients = [
    'linear-gradient(135deg,#1B3C6B,#7C3AED)',
    'linear-gradient(135deg,#22C55E,#059669)',
    'linear-gradient(135deg,#F97316,#F59E0B)',
    'linear-gradient(135deg,#7C3AED,#9F67FA)',
    'linear-gradient(135deg,#EF4444,#F97316)',
    'linear-gradient(135deg,#0891B2,#2563EB)',
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.profileSlug.set(id);
    const token = this.auth.getAccessToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    this.isLoggedIn.set(!!token);

    this.http.get<any>(`${environment.apiUrl}/v1/profile/${id}/`, { headers }).subscribe({
      next: (res) => {
        const u = res.user || {};
        const prénom = res.prenom || u.username || '';
        const nom = res.nom || '';
        this.prenom.set(prénom);
        this.nom.set(nom);
        this.initials.set((prénom.slice(0,1) + (nom.slice(0,1) || prénom.slice(1,2))).toUpperCase());
        this.city.set(res.city?.name_fr || '');
        this.bio.set(res.bio || '');
        this.type.set(res.type || '');
        this.statut.set(res.statut || '');
        this.radius.set(res.radius || null);
        this.skills.set((res.skills || []).map((s: any) => s.name_fr || s));
        this.isVerified.set(res.is_verified || false);
        this.avgRating.set(res.average_rating || 0);
        this.reviewCount.set(res.review_count || 0);
        this.ratingData.set(res.rating_data || []);
        this.reviews.set(res.reviews || []);
        this.annonces.set(res.annonces || []);
        this.projects.set(res.projects || []);
        this.isFav.set(res.is_favorite || false);
        const pic = res.profile_picture_url;
        if (pic && !pic.includes('defaultprofile')) this.avatarUrl.set(pic);
        this.loading.set(false);

        if (token) {
          this.http.get<any>(`${environment.apiUrl}/v1/auth/users/me/`, { headers }).subscribe({
            next: (me) => {
              this.isOwnProfile.set(me.profile?.slug === id || me.username === u.username);
              const existing = (res.reviews || []).find((r: any) => r.reviewer?.username === me.username);
              if (existing) {
                this.myExistingReview.set(existing);
                this.reviewRating.set(existing.rating);
                this.reviewComment = existing.comment || '';
              }
            },
          });
        }
      },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initUnderline(), 100);
  }

  private initUnderline(): void {
    const active = document.querySelector('#pp-tabs .tab-btn.active') as HTMLElement;
    if (active) this.moveUnderline(active);
  }

  switchTab(tabId: string, event: Event): void {
    document.querySelectorAll('#pp-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const btn = event.currentTarget as HTMLElement;
    btn.classList.add('active');
    document.getElementById(`pp-tab-${tabId}`)?.classList.add('active');
    this.moveUnderline(btn);
  }

  private moveUnderline(btn: HTMLElement): void {
    const underline = document.getElementById('pp-underline') as HTMLElement;
    const parent = btn.closest('.tabs-inner') as HTMLElement;
    if (!underline || !parent) return;
    const rect = btn.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    underline.style.left = (rect.left - parentRect.left) + 'px';
    underline.style.width = rect.width + 'px';
  }

  contact(): void {
    if (!this.auth.getAccessToken()) { this.router.navigate(['/auth/login']); return; }
    this.router.navigate(['/messages'], { queryParams: { slug: this.profileSlug() } });
  }

  toggleFav(): void {
    if (!this.auth.getAccessToken()) { this.router.navigate(['/auth/login']); return; }
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.auth.getAccessToken()}` });
    this.http.post(`${environment.apiUrl}/v1/favorites/${this.profileSlug()}/favorite/`, {}, { headers }).subscribe({
      next: () => this.isFav.update(v => !v),
    });
  }

  openLightbox(i: number): void { this.lightboxIndex.set(i); this.lightboxOpen.set(true); }
  closeLightbox(): void { this.lightboxOpen.set(false); }
  lightboxBgClose(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('lightbox-overlay')) this.closeLightbox();
  }
  lightboxNav(dir: number): void {
    const total = this.projects().length;
    if (!total) return;
    this.lightboxIndex.update(i => (i + dir + total) % total);
  }

  portfolioGradient(i: number): string { return this.gradients[i % this.gradients.length]; }

  isOffre(a: any): boolean {
    return a.category?.id === 2 || a.category?.name_fr?.toLowerCase().includes('offre');
  }

  starsOf(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(Math.min(full, 5)) + '☆'.repeat(Math.max(0, 5 - full));
  }

  avatarColorFor(name: string): string {
    const colors = ['linear-gradient(135deg,#1B3C6B,#7C3AED)', 'linear-gradient(135deg,#22C55E,#059669)', 'linear-gradient(135deg,#F97316,#F59E0B)'];
    let h = 0;
    for (let i = 0; i < (name || '').length; i++) h = (h * 31 + (name || '').charCodeAt(i)) % colors.length;
    return colors[h];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)} jours`;
  }

  private reviewHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getAccessToken()}` });
  }

  submitReview(): void {
    if (this.reviewRating() === 0) return;
    this.reviewSubmitting.set(true);
    this.reviewMsg.set('');
    const body = { rating: this.reviewRating(), comment: this.reviewComment };
    const slug = this.profileSlug();
    this.http.post<any>(`${environment.apiUrl}/v1/reviews/${slug}/`, body, { headers: this.reviewHeaders() }).subscribe({
      next: (res) => {
        this.reviewSubmitting.set(false);
        this.reviewMsgOk.set(true);
        this.reviewMsg.set('Avis publié avec succès !');
        this.myExistingReview.set(res.review);
        const updatedReviews = [
          res.review,
          ...this.reviews().filter((r: any) => r.id !== res.review.id),
        ];
        this.reviews.set(updatedReviews);
        this.reviewCount.set(updatedReviews.length);
        const avg = updatedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / updatedReviews.length;
        this.avgRating.set(Math.round(avg * 10) / 10);
        setTimeout(() => this.reviewMsg.set(''), 3000);
      },
      error: (err) => {
        this.reviewSubmitting.set(false);
        this.reviewMsgOk.set(false);
        this.reviewMsg.set(err.error?.error || 'Erreur lors de la soumission.');
      },
    });
  }

  deleteReview(): void {
    const slug = this.profileSlug();
    this.http.delete<any>(`${environment.apiUrl}/v1/reviews/${slug}/`, { headers: this.reviewHeaders() }).subscribe({
      next: () => {
        const existing = this.myExistingReview();
        this.myExistingReview.set(null);
        this.reviewRating.set(0);
        this.reviewComment = '';
        const updatedReviews = this.reviews().filter((r: any) => r.id !== existing?.id);
        this.reviews.set(updatedReviews);
        this.reviewCount.set(updatedReviews.length);
        if (updatedReviews.length > 0) {
          const avg = updatedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / updatedReviews.length;
          this.avgRating.set(Math.round(avg * 10) / 10);
        } else {
          this.avgRating.set(0);
        }
        this.reviewMsgOk.set(true);
        this.reviewMsg.set('Avis supprimé.');
        setTimeout(() => this.reviewMsg.set(''), 3000);
      },
    });
  }
}
