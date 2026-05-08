import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatButtonModule, MatMenuModule, MatIconModule, MatBadgeModule, MatDividerModule],
  styles: [`
    nav { position: sticky; top: 0; z-index: 999; display: flex; align-items: center; gap: 16px;
      height: 64px; padding: 0 32px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.08);
      transition: box-shadow .2s ease; font-family: "DM Sans",system-ui,sans-serif; }
    .logo { display: inline-flex; flex-direction: row; align-items: center; gap: 0; margin-right: 16px; text-decoration: none; }
    .logo-bricole { color: #1B3C6B; font-weight: 900; font-size: 1.5rem; font-family: Poppins,system-ui,sans-serif; }
    .logo-up { color: #F97316; font-weight: 900; font-size: 1.5rem; font-family: Poppins,system-ui,sans-serif; }
    .post-ad-btn { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; border: 0;
      border-radius: 50px; padding: 10px 22px; background: #F97316; color: #fff;
      font: 700 .95rem "DM Sans",system-ui,sans-serif; cursor: pointer; white-space: nowrap;
      transition: background .2s ease, transform .2s ease; text-decoration: none; }
    .post-ad-btn:hover { background: #e0650f; transform: scale(1.02); }
    .nav-actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; margin-left: auto; }
    .nav-action { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px;
      min-width: 72px; border: 0; border-radius: 8px; padding: 8px 12px; background: transparent;
      color: #64748B; font: 500 .72rem "DM Sans",system-ui,sans-serif; text-align: center; cursor: pointer;
      transition: background .2s ease, color .2s ease; text-decoration: none; }
    .nav-action:hover { background: #F8FAFC; color: #1B3C6B; }
    .nav-icon { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; }
    .notif-dot { position: absolute; top: -1px; right: -2px; width: 8px; height: 8px;
      border: 2px solid #fff; border-radius: 50%; background: #EF4444; }
    .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #BFDBFE;
      color: #1B3C6B; font-weight: 800; font-size: .8rem; display: flex; align-items: center; justify-content: center; }
    .mat-menu-wrap { position: relative; }
    @media (max-width: 768px) {
      nav { flex-wrap: wrap; height: auto; min-height: 64px; padding: 10px 16px; gap: 10px; }
      .nav-action:nth-child(1), .nav-action:nth-child(2) { display: none; }
      .nav-action span:last-child { display: none; }
    }
  `],
  template: `
    <nav id="navbar">
      <a routerLink="/" class="logo" aria-label="BricoleUp accueil">
        <span class="logo-bricole">Bricole</span><span class="logo-up">Up</span>
      </a>
      <a class="post-ad-btn" routerLink="/annonces/create">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="4"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Déposer une annonce
      </a>
      <nav class="nav-actions" aria-label="Accès rapides">
        <button class="nav-action" type="button">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B3C6B" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            @if (unreadCount()) { <span class="notif-dot"></span> }
          </span>
          <span>Alertes</span>
        </button>
        <a class="nav-action" routerLink="/messages">
          <span class="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B3C6B" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span>Messages</span>
        </a>
        @if (isAuthenticated()) {
          <button class="nav-action" type="button" [matMenuTriggerFor]="userMenu">
            <span class="nav-icon">
              @if (currentUser()?.avatar) {
                <img [src]="currentUser()?.avatar" alt="Avatar" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">
              } @else {
                <div class="user-avatar">{{ currentUser()?.prenom?.[0] }}{{ currentUser()?.nom?.[0] }}</div>
              }
            </span>
            <span>{{ currentUser()?.prenom }}</span>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item routerLink="/profil">Mon profil</button>
            <button mat-menu-item routerLink="/reservations">Mes réservations</button>
            @if (isPrestataire()) {
              <button mat-menu-item routerLink="/dashboard">Dashboard</button>
            }
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">Déconnexion</button>
          </mat-menu>
        } @else {
          <button class="nav-action" type="button" routerLink="/auth/login">
            <span class="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B3C6B" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <span>Se connecter</span>
          </button>
        }
      </nav>
    </nav>
  `,
})
export class NavbarComponent {
  readonly currentUser = this.authService.currentUser$;
  readonly isAuthenticated = this.authService.isAuthenticated$;
  readonly isPrestataire = this.authService.isPrestataire$;
  readonly unreadCount = this.notifService.unreadCount;

  constructor(
    private authService: AuthService,
    private notifService: NotificationService,
  ) {}

  logout(): void {
    this.authService.logout().subscribe();
  }
}
