import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeedNavbarComponent } from './shared/components/feed-navbar/feed-navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NotificationService } from './core/services/notification.service';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FeedNavbarComponent, FooterComponent],
  template: `
    @if (showFeedNav()) {
      <app-feed-navbar />
    }
    <main style="min-height:100vh;">
      <router-outlet />
    </main>
  `,
})
export class AppComponent implements OnInit {
  showFeedNav = signal(false);

  constructor(
    private notifService: NotificationService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated$()) {
      this.notifService.startPolling();
    }
    const check = (url: string) => {
      const path = url.split('?')[0];
      return ['/annonces', '/demandes', '/prestataires', '/favoris'].includes(path)
        || path.startsWith('/profil')
        || path.startsWith('/messages')
        || path.startsWith('/reservations')
        || path.startsWith('/dashboard');
    };
    this.showFeedNav.set(check(this.router.url));
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.showFeedNav.set(check(e.urlAfterRedirects));
    });
  }
}
