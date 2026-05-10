import { Component, OnInit, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-feed-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    :root {
      --bleu:#1B3C6B; --bleu-dark:#132d52; --bleu-light:#EFF6FF;
      --orange:#F97316; --orange-light:#FFF7ED;
      --vert:#22C55E; --gris:#64748B; --border:#E2E8F0;
      --texte:#0F172A; --gris-light:#F8FAFC;
    }
    * { box-sizing: border-box; }

    /* ── DESKTOP navbar (inspiré topbar admin) ── */
    .navbar {
      position: sticky; top: 0; z-index: 999; height: 64px;
      background: #fff;
      border-bottom: 1px solid var(--border);
      box-shadow: 0 1px 4px rgba(15,23,42,.06);
      display: flex; align-items: center; transition: box-shadow .2s;
    }
    .navbar.scrolled { box-shadow: 0 4px 20px rgba(15,23,42,.12); }
    .navbar-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; width: 100%; display: flex; align-items: center; }
    .nav-logo { display: flex; flex-direction: column; align-items: flex-start; text-decoration: none; flex-shrink: 0; margin-right: 28px; cursor: pointer; background: none; border: none; padding: 0; }
    .nav-logo-title { font-family:'Poppins',sans-serif; font-size:1.45rem; font-weight:900; line-height:1; letter-spacing:-.03em; }
    .nav-logo-title .bricole { color: var(--bleu); }
    .nav-logo-title .up { color: var(--orange); }
    .nav-logo-location { font-size:.72rem; color:var(--gris); margin-top:3px; display:flex; align-items:center; gap:3px; font-weight:600; }
    .nav-tabs { display:flex; align-items:stretch; gap:2px; flex:1; justify-content:center; height:64px; }
    .nav-tab { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:6px 16px; cursor:pointer; border:none; background:transparent; border-bottom:2px solid transparent; gap:2px; transition:background .15s,color .15s; min-width:64px; position:relative; }
    .nav-tab svg { width:20px; height:20px; }
    .nav-tab-label { font-size:.73rem; font-family:'DM Sans',sans-serif; font-weight:700; letter-spacing:.01em; }
    .nav-tab.active { background:var(--bleu-light); color:var(--bleu); border-bottom-color:var(--bleu); }
    .nav-tab:not(.active) { color:var(--gris); }
    .nav-tab:not(.active):hover { color:var(--bleu); background:var(--bleu-light); }
    .nav-tab-plus .plus-circle { width:32px; height:32px; background:var(--orange); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 2px 10px rgba(249,115,22,.35); }
    .nav-tab-plus .plus-circle svg { width:16px; height:16px; }
    .nav-tab-heart svg { transition:fill .2s,stroke .2s; }
    .nav-tab-heart.active svg { fill:var(--orange); stroke:var(--orange); }
    .fav-badge { position:absolute; top:4px; right:10px; min-width:16px; height:16px; background:var(--orange); color:#fff; border-radius:50px; font-size:.6rem; font-weight:800; display:flex; align-items:center; justify-content:center; padding:0 4px; border:2px solid #fff; }
    .nav-avatar { width:30px; height:30px; background:var(--bleu); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:.72rem; font-weight:800; font-family:'Poppins',sans-serif; }
    .nav-right { display:flex; align-items:center; gap:8px; flex-shrink:0; margin-left:16px; }
    .nav-icon-btn { width:38px; height:38px; border-radius:10px; border:1.5px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--gris); transition:all .15s; position:relative; }
    .nav-icon-btn:hover,.nav-icon-btn.active { border-color:var(--bleu); color:var(--bleu); background:var(--bleu-light); }
    .nav-notif-dot { position:absolute; top:7px; right:7px; width:7px; height:7px; background:var(--orange); border-radius:50%; border:2px solid #fff; }
    .nav-notif-badge { position:absolute; top:4px; right:4px; min-width:16px; height:16px; background:var(--orange); color:#fff; border-radius:50px; font-size:.58rem; font-weight:800; display:flex; align-items:center; justify-content:center; padding:0 4px; border:2px solid #fff; }
    .notif-wrap { position:relative; }
    .notif-backdrop { position:fixed; inset:0; z-index:998; }
    .notif-panel { position:absolute; top:calc(100% + 10px); right:0; width:320px; background:#fff; border-radius:14px; box-shadow:0 8px 32px rgba(15,23,42,.15); border:1px solid var(--border); z-index:999; overflow:hidden; max-height:420px; display:flex; flex-direction:column; }
    .notif-panel-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px; border-bottom:1px solid var(--border); flex-shrink:0; }
    .notif-panel-title { font-family:'Poppins',sans-serif; font-weight:700; font-size:.95rem; color:var(--texte); }
    .notif-read-all { background:none; border:none; color:var(--orange); font-size:.78rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; }
    .notif-read-all:hover { text-decoration:underline; }
    .notif-empty { padding:36px 16px; text-align:center; color:var(--gris); font-size:.86rem; }
    .notif-list { overflow-y:auto; max-height:320px; }
    .notif-item { display:flex; gap:12px; padding:12px 16px; border-bottom:1px solid #F1F5F9; transition:background .15s; cursor:default; align-items:flex-start; }
    .notif-item.unread { background:linear-gradient(90deg,#FFF7ED 0%,#fff 100%); border-left:3px solid var(--orange); }
    .notif-item:hover { background:#F8FAFC; }
    .notif-icon-wrap { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; }
    .notif-icon-message { background:#EFF6FF; }
    .notif-icon-comment { background:#F0FDF4; }
    .notif-icon-like    { background:#FFF1F2; }
    .notif-icon-review  { background:#FFFBEB; }
    .notif-icon-welcome { background:#F5F3FF; }
    .notif-body { flex:1; min-width:0; }
    .notif-title { font-weight:700; font-size:.82rem; color:var(--texte); }
    .notif-desc { font-size:.75rem; color:var(--gris); margin-top:2px; line-height:1.4; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
    .notif-time { font-size:.67rem; color:#94A3B8; margin-top:4px; }
    .notif-show-more {
      width:100%; padding:12px 16px; border:none; background:linear-gradient(135deg,var(--orange),#e0650f);
      color:#fff; font-size:.82rem; font-weight:700; cursor:pointer;
      font-family:'DM Sans',sans-serif; transition:filter .2s;
      border-radius:0 0 14px 14px;
    }
    .notif-show-more:hover { filter:brightness(1.08); }

    /* Cloche mobile : cachée par défaut (desktop) */
    .mobile-notif-wrap { display: none; }

    /* Navbar mobile top */
    .mobile-top-nav {
      display: none;
    }
    @media (max-width: 900px) {
      .mobile-top-nav {
        display: flex !important;
        position: sticky; top: 0; z-index: 999;
        height: 60px; padding: 0 16px;
        background: #fff;
        border-bottom: 1px solid var(--border);
        box-shadow: 0 1px 4px rgba(15,23,42,.06);
        align-items: center;
        justify-content: space-between;
      }
      .mtn-logo { display: flex; flex-direction: column; gap: 2px; cursor: pointer; background: none; border: none; padding: 0; }
      .mtn-logo-title { font-family:'Poppins',sans-serif; font-size:1.2rem; font-weight:900; letter-spacing:-.03em; line-height:1; }
      .mtn-logo-title .bricole { color: var(--bleu); }
      .mtn-logo-title .up { color: var(--orange); }
      .mtn-location {
        font-size:.65rem; font-weight:700; color: var(--orange);
        background:#FFF7ED; border:1.5px solid #FDBA74;
        border-radius:50px; padding:2px 8px;
        display:flex; align-items:center; gap:3px;
      }
      .mtn-right { display:flex; align-items:center; gap:8px; }
      .mtn-notif-btn {
        width:36px; height:36px; border-radius:10px;
        border:1.5px solid var(--border); background:#fff;
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; color:var(--gris); position:relative;
      }
      .mtn-notif-btn svg { width:18px; height:18px; }
      .mtn-badge {
        position:absolute; top:4px; right:4px;
        min-width:15px; height:15px;
        background:var(--orange); color:#fff;
        border-radius:50px; font-size:.55rem; font-weight:800;
        display:flex; align-items:center; justify-content:center;
        padding:0 3px; border:2px solid #fff;
      }
    }

    /* ── MOBILE : barre en bas style app native (fond blanc) ── */
    @media (max-width: 900px) {
      .navbar { display: none !important; }
      .desktop-only { display: none !important; }
      .nav-tabs { display: none !important; }
      .nav-right { display: none !important; }
      .nav-logo {
        margin: 0;
        display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
      }
      .nav-logo-title { font-size: 1.25rem; letter-spacing: -.03em; line-height: 1; }
      .nav-logo-location {
        font-size: .68rem; font-weight: 700; color: var(--orange);
        background: #FFF7ED; border: 1.5px solid #FDBA74;
        border-radius: 50px; padding: 2px 8px; margin-top: 0;
        display: flex; align-items: center; gap: 3px;
      }
      .navbar-inner { justify-content: space-between; padding: 0 16px; align-items: center; }
      /* Cloche notif visible sur mobile */
      .mobile-notif-wrap { display: flex; align-items: center; margin-left: auto; }
      .mobile-notif-btn {
        display: flex; align-items: center; justify-content: center;
        width: 36px; height: 36px; border-radius: 10px;
        border: 1.5px solid var(--border); background: #fff;
        color: var(--gris); cursor: pointer; position: relative;
        flex-shrink: 0;
      }
      .mobile-notif-btn svg { width: 18px; height: 18px; }
      .mobile-notif-badge {
        position: absolute; top: 4px; right: 4px;
        min-width: 15px; height: 15px;
        background: var(--orange); color: #fff;
        border-radius: 50px; font-size: .55rem; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
        padding: 0 3px; border: 2px solid #fff;
      }
      /* Notif panel mobile pleine largeur */
      .mobile-notif-wrap { position: relative; }
      .mobile-notif-wrap .notif-panel {
        position: fixed; top: 58px; left: 8px; right: 8px; width: auto;
      }

      /* Barre du bas */
      .mobile-nav {
        display: flex !important;
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 999;
        background: #fff;
        border-top: 1.5px solid var(--border);
        box-shadow: 0 -4px 20px rgba(0,0,0,.08);
        height: 62px;
        padding-bottom: env(safe-area-inset-bottom);
      }
      .mobile-nav-tab {
        flex: 1; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        border: none; background: transparent;
        color: var(--gris);
        gap: 3px; cursor: pointer;
        font-family: 'DM Sans', sans-serif;
        font-size: .63rem; font-weight: 700;
        transition: color .15s;
        position: relative; padding: 0;
        letter-spacing: .01em;
      }
      .mobile-nav-tab svg { width: 22px; height: 22px; stroke: var(--gris); transition: stroke .15s, fill .15s; }
      .mobile-nav-tab.active { color: var(--bleu); }
      .mobile-nav-tab.active svg { stroke: var(--bleu); }

      /* Avatar "Moi" */
      .mobile-nav-tab .nav-avatar {
        width: 26px; height: 26px;
        background: var(--bleu);
        font-size: .66rem;
      }

      /* Bouton + central surélevé */
      .mobile-nav-create {
        flex: 1; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        border: none; background: transparent; cursor: pointer;
        position: relative; padding: 0;
      }
      .mobile-create-circle {
        width: 50px; height: 50px;
        background: linear-gradient(135deg, var(--orange), #e0650f);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(249,115,22,.45);
        margin-top: -14px;
        transition: transform .15s, box-shadow .15s;
      }
      .mobile-nav-create:active .mobile-create-circle {
        transform: scale(.92);
        box-shadow: 0 2px 8px rgba(249,115,22,.35);
      }
      .mobile-create-circle svg { width: 22px; height: 22px; stroke: #fff; }

      /* Badge */
      .mobile-nav-badge {
        position: absolute; top: 6px; right: calc(50% - 18px);
        min-width: 16px; height: 16px;
        background: var(--orange); color: #fff;
        border-radius: 50px; font-size: .58rem; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
        padding: 0 4px; border: 2px solid #fff;
      }

      /* Favoris */
      .mobile-fav-wrap {
        position: relative;
        display: flex; align-items: center; justify-content: center;
      }
      .mobile-nav-fav.active svg { stroke: var(--orange); fill: rgba(249,115,22,.1); }
      .mobile-fav-badge {
        position: absolute; top: -6px; right: -8px;
        min-width: 15px; height: 15px;
        background: var(--orange); color: #fff;
        border-radius: 50px; font-size: .56rem; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
        padding: 0 3px; border: 2px solid #fff;
      }

      :host { display: block; margin-bottom: 0; }
    }

    @media (min-width: 901px) {
      .mobile-nav { display: none !important; }
    }
  `],
  template: `
    <!-- NAVBAR MOBILE TOP -->
    <div class="mobile-top-nav">
      <button class="mtn-logo" (click)="goHome()">
        <span class="mtn-logo-title"><span class="bricole">Bricole</span><span class="up">Up</span></span>
        <span class="mtn-location">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ ville() || 'Ma position' }}
        </span>
      </button>
      <div class="mtn-right">
        <div class="notif-wrap">
          <button class="mtn-notif-btn" (click)="toggleNotif()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            @if (notifCount() > 0) { <span class="mtn-badge">{{ notifCount() }}</span> }
          </button>
          @if (notifOpen()) {
            <div class="notif-panel">
              <div class="notif-panel-head">
                <span class="notif-panel-title">Notifications</span>
                @if (notifCount() > 0) { <button class="notif-read-all" (click)="markAllRead()">Tout marquer lu</button> }
              </div>
              @if (notifications().length === 0) { <div class="notif-empty">🔔 Aucune notification</div> }
              <div class="notif-list">
                @for (n of notifications().slice(0, 5); track n.id) {
                  <div class="notif-item" [class.unread]="!n.is_read">
                    <div class="notif-icon-wrap" [class]="'notif-icon-' + n.type"><span>{{ notifIcon(n.type) }}</span></div>
                    <div class="notif-body">
                      <div class="notif-title">{{ n.title }}</div>
                      <div class="notif-desc">{{ n.description }}</div>
                      <div class="notif-time">{{ timeAgoNotif(n.created_at) }}</div>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="notif-backdrop" (click)="notifOpen.set(false)"></div>
          }
        </div>
      </div>
    </div>

    <!-- NAVBAR DESKTOP (haut) — cachée sur mobile via JS -->
    <nav class="navbar desktop-only" [class.scrolled]="scrolled()" id="navbar">
      <div class="navbar-inner">

        <button class="nav-logo" (click)="goHome()">
          <span class="nav-logo-title">
            <span class="bricole">Bricole</span><span class="up">Up</span>
          </span>
          <span class="nav-logo-location">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ ville() || 'Ma position' }}
          </span>
        </button>

        <!-- Cloche notif mobile (cachée sur desktop) -->
        <div class="mobile-notif-wrap">
          <button class="mobile-notif-btn" (click)="toggleNotif()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            @if (notifCount() > 0) { <span class="mobile-notif-badge">{{ notifCount() }}</span> }
          </button>
          @if (notifOpen()) {
            <div class="notif-panel">
              <div class="notif-panel-head">
                <span class="notif-panel-title">Notifications</span>
                @if (notifCount() > 0) {
                  <button class="notif-read-all" (click)="markAllRead()">Tout marquer lu</button>
                }
              </div>
              @if (notifications().length === 0) {
                <div class="notif-empty">🔔 Aucune notification</div>
              }
              <div class="notif-list">
                @for (n of notifications().slice(0, notifShowAll() ? 999 : 3); track n.id) {
                  <div class="notif-item" [class.unread]="!n.is_read">
                    <div class="notif-icon-wrap" [class]="'notif-icon-' + n.type">
                      <span>{{ notifIcon(n.type) }}</span>
                    </div>
                    <div class="notif-body">
                      <div class="notif-title">{{ n.title }}</div>
                      <div class="notif-desc">{{ n.description }}</div>
                      <div class="notif-time">{{ timeAgoNotif(n.created_at) }}</div>
                    </div>
                  </div>
                }
              </div>
              @if (notifications().length > 3 && !notifShowAll()) {
                <button class="notif-show-more" (click)="notifShowAll.set(true)">
                  Voir {{ notifications().length - 3 }} autres →
                </button>
              }
            </div>
            <div class="notif-backdrop" (click)="notifOpen.set(false)"></div>
          }
        </div>

        <!-- Tabs desktop -->
        <div class="nav-tabs">
          <button class="nav-tab" [class.active]="activeTab()==='accueil'" (click)="navigate('/annonces', 'accueil')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span class="nav-tab-label">Accueil</span>
          </button>
          <button class="nav-tab" [class.active]="activeTab()==='offres'" (click)="navigate('/annonces', 'offres')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span class="nav-tab-label">Offres</span>
          </button>
          <button class="nav-tab" [class.active]="activeTab()==='demandes'" (click)="navigate('/annonces', 'demandes')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
            <span class="nav-tab-label">Demandes</span>
          </button>
          <button class="nav-tab nav-tab-heart" [class.active]="activeTab()==='favoris'" (click)="navigate('/favoris', 'favoris')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            @if (favCount() > 0) { <span class="fav-badge">{{ favCount() }}</span> }
            <span class="nav-tab-label">Favoris</span>
          </button>
          <button class="nav-tab nav-tab-plus" (click)="openCreate()">
            <div class="plus-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <span class="nav-tab-label">Créer</span>
          </button>
          <button class="nav-tab" [class.active]="activeTab()==='moi'" (click)="navigate('/profil', 'moi')">
            <div class="nav-avatar">{{ avatarInitials() }}</div>
            <span class="nav-tab-label">Moi</span>
          </button>
        </div>

        <div class="nav-right">
          <!-- Cloche notifications -->
          <div class="notif-wrap">
            <button class="nav-icon-btn" (click)="toggleNotif()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              @if (notifCount() > 0) { <span class="nav-notif-badge">{{ notifCount() }}</span> }
            </button>
            @if (notifOpen()) {
              <div class="notif-panel">
                <div class="notif-panel-head">
                  <span class="notif-panel-title">Notifications</span>
                  @if (notifCount() > 0) {
                    <button class="notif-read-all" (click)="markAllRead()">Tout marquer lu</button>
                  }
                </div>
                @if (notifications().length === 0) {
                  <div class="notif-empty">🔔 Aucune notification</div>
                }
                <div class="notif-list">
                  @for (n of notifications().slice(0, notifShowAll() ? 999 : 3); track n.id) {
                    <div class="notif-item" [class.unread]="!n.is_read">
                      <div class="notif-icon-wrap" [class]="'notif-icon-' + n.type">
                        <span>{{ notifIcon(n.type) }}</span>
                      </div>
                      <div class="notif-body">
                        <div class="notif-title">{{ n.title }}</div>
                        <div class="notif-desc">{{ n.description }}</div>
                        <div class="notif-time">{{ timeAgoNotif(n.created_at) }}</div>
                      </div>
                    </div>
                  }
                </div>
                @if (notifications().length > 3 && !notifShowAll()) {
                  <button class="notif-show-more" (click)="notifShowAll.set(true)">
                    Voir {{ notifications().length - 3 }} autres notifications →
                  </button>
                }
              </div>
              <div class="notif-backdrop" (click)="notifOpen.set(false)"></div>
            }
          </div>
          <button class="nav-icon-btn" [class.active]="activeTab()==='messages'" (click)="navigate('/messages', 'messages')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            @if (unreadCount() > 0) { <span class="nav-notif-dot"></span> }
          </button>
        </div>

      </div>
    </nav>

    <!-- BARRE MOBILE (bas) -->
    <div class="mobile-nav">
      <button class="mobile-nav-tab" [class.active]="activeTab()==='accueil'" (click)="navigate('/annonces','accueil')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Accueil
      </button>
      <button class="mobile-nav-tab mobile-nav-fav" [class.active]="activeTab()==='favoris'" (click)="navigate('/favoris','favoris')">
        <div class="mobile-fav-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          @if (favCount() > 0) { <span class="mobile-nav-badge mobile-fav-badge">{{ favCount() }}</span> }
        </div>
        Favoris
      </button>
      <button class="mobile-nav-create" (click)="openCreate()">
        <div class="mobile-create-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </button>
      <button class="mobile-nav-tab" [class.active]="activeTab()==='messages'" (click)="navigate('/messages','messages')">
        <div class="mobile-fav-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          @if (unreadCount() > 0) { <span class="mobile-nav-badge">{{ unreadCount() }}</span> }
        </div>
        Messages
      </button>
      <button class="mobile-nav-tab" [class.active]="activeTab()==='moi'" (click)="navigate('/profil','moi')">
        <div class="nav-avatar">{{ avatarInitials() }}</div>
        Moi
      </button>
    </div>
  `,
})
export class FeedNavbarComponent implements OnInit {
  private router = inject(Router);
  private http   = inject(HttpClient);
  private auth   = inject(AuthService);

  scrolled        = signal(false);
  ville           = signal('');
  avatarInitials  = signal('?');
  activeTab        = signal('accueil');
  favCount         = signal(0);
  unreadCount      = signal(0);
  notifCount       = signal(0);
  notifications    = signal<any[]>([]);
  notifOpen        = signal(false);
  notifShowAll     = signal(false);

  private notifInterval: any = null;

  ngOnInit(): void {
    window.addEventListener('scroll', () => this.scrolled.set(window.scrollY > 10));

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url = e.urlAfterRedirects;
      if (url.startsWith('/profil/') || url === '/profil') this.activeTab.set('moi');
      else if (url === '/annonces') this.activeTab.set('accueil');
      else if (url.startsWith('/messages')) this.activeTab.set('messages');
      else if (url === '/favoris') this.activeTab.set('favoris');
      else this.activeTab.set('');
    });
    // Lire l'URL actuelle au démarrage
    const cur = this.router.url;
    if (cur.startsWith('/messages')) this.activeTab.set('messages');
    else if (cur.startsWith('/profil')) this.activeTab.set('moi');
    else if (cur === '/favoris') this.activeTab.set('favoris');

    this.loadVille();
    this.loadUser();
    this.loadFavCount();
    this.loadUnreadCount();
    this.loadNotifications();
    this.notifInterval = setInterval(() => this.loadNotifications(), 30000);

    window.addEventListener('bu:favcount', (e: any) => this.favCount.set(e.detail ?? 0));
  }

  goHome(): void { this.router.navigate(['/annonces']); }

  navigate(path: string, tab: string): void {
    this.activeTab.set(tab);
    if (path === '/annonces' && this.router.url === '/annonces') {
      (window as any).setFeedView?.(tab === 'offres' ? 'offres' : tab === 'demandes' ? 'demandes' : 'all');
    } else {
      this.router.navigate([path]);
    }
  }

  openCreate(): void {
    if (this.router.url !== '/annonces') {
      this.router.navigate(['/annonces']).then(() => {
        setTimeout(() => (window as any).openModal?.(), 400);
      });
    } else {
      (window as any).openModal?.();
    }
  }

  private loadUser(): void {
    const token = this.auth.getAccessToken();
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>(`${environment.apiUrl}/account/infos/`, { headers }).subscribe({
      next: (res) => {
        const prenom = res?.prenom || res?.first_name || res?.username || '';
        if (prenom) this.avatarInitials.set(prenom.slice(0, 2).toUpperCase());
      },
    });
  }

  private loadNotifications(): void {
    const token = this.auth.getAccessToken();
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>(`${environment.apiUrl}/v1/notifications/`, { headers }).subscribe({
      next: (res) => {
        this.notifications.set(res.results || []);
        this.notifCount.set(res.unread_count || 0);
      },
      error: () => {},
    });
  }

  toggleNotif(): void {
    const opening = !this.notifOpen();
    this.notifOpen.set(opening);
    if (opening) { this.notifShowAll.set(false); this.loadNotifications(); }
  }

  markAllRead(): void {
    const token = this.auth.getAccessToken();
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.post<any>(`${environment.apiUrl}/v1/notifications/read-all/`, {}, { headers }).subscribe({
      next: () => {
        this.notifCount.set(0);
        this.notifications.update(list => list.map(n => ({ ...n, is_read: true })));
      }
    });
  }

  notifIcon(type: string): string {
    const icons: any = { message: '💬', comment: '🗨️', like: '❤️', review: '⭐', welcome: '👋' };
    return icons[type] || '🔔';
  }

  timeAgoNotif(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
  }

  private loadUnreadCount(): void {
    const token = this.auth.getAccessToken();
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>(`${environment.apiUrl}/conversations/`, { headers }).subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        const unread = list.filter((c: any) => c.last_message?.is_read === false).length;
        this.unreadCount.set(unread);
      },
      error: () => {},
    });
  }

  private loadFavCount(): void {
    const token = this.auth.getAccessToken();
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>(`${environment.apiUrl}/v1/favorites/`, { headers }).subscribe({
      next: (data) => {
        const favs = (data || []).length;
        const likes = (() => { try { return JSON.parse(localStorage.getItem('bu_liked_cards') || '[]').length; } catch { return 0; } })();
        this.favCount.set(favs + likes);
      },
      error: () => {
        try { this.favCount.set(JSON.parse(localStorage.getItem('bu_liked_cards') || '[]').length); } catch { /* */ }
      },
    });
  }

  private loadVille(): void {
    this.http.get<any>(`${environment.apiUrl}/geo/city/`).subscribe({
      next: (res) => { if (res?.city) this.ville.set(res.city); },
    });
  }
}
