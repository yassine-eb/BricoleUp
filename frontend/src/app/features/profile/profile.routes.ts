import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./edit/profile-edit.component').then(m => m.ProfileEditComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./prestataire/prestataire-profile.component').then(m => m.PrestataireProfileComponent),
  },
];
