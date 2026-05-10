import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { LandingComponent } from './features/landing/landing.component';
import { FeedComponent } from './features/feed/feed.component';
import { DemandesComponent } from './features/demandes/demandes.component';
import { PrestatairesComponent } from './features/prestataires/prestataires.component';
import { AdminLoginComponent } from './features/admin-login/admin-login.component';
import { FavorisComponent } from './features/favoris/favoris.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'annonces',
    component: FeedComponent,
    canActivate: [AuthGuard],
    pathMatch: 'full',
  },
  {
    path: 'demandes',
    component: DemandesComponent,
    canActivate: [AuthGuard],
    pathMatch: 'full',
  },
  {
    path: 'prestataires',
    component: PrestatairesComponent,
    canActivate: [AuthGuard],
    pathMatch: 'full',
  },
  {
    path: 'profil',
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
    canActivate: [AuthGuard, RoleGuard('prestataire')],
  },
  {
    path: 'messages',
    loadChildren: () => import('./features/messaging/messaging.routes').then(m => m.MESSAGING_ROUTES),
    canActivate: [AuthGuard],
  },
  {
    path: 'reservations',
    loadChildren: () => import('./features/bookings/bookings.routes').then(m => m.BOOKINGS_ROUTES),
    canActivate: [AuthGuard],
  },
  {
    path: 'favoris',
    component: FavorisComponent,
    canActivate: [AuthGuard],
    pathMatch: 'full',
  },
  {
    path: 'admin-login',
    component: AdminLoginComponent,
    pathMatch: 'full',
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [AdminGuard],
  },
  { path: '**', redirectTo: '' },
];
