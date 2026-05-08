import { Routes } from '@angular/router';
import { AdminShellComponent } from './admin-shell/admin-shell.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminComponent } from './admin.component';
import { AdminAnnoncesComponent } from './annonces/admin-annonces.component';
import { AdminOffresComponent } from './offres/admin-offres.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'utilisateurs', component: AdminComponent },
      { path: 'annonces', component: AdminAnnoncesComponent },
      { path: 'offres', component: AdminOffresComponent },
    ],
  },
];
