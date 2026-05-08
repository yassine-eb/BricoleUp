import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

export const ADS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/ad-list.component').then(m => m.AdListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./create/ad-create.component').then(m => m.AdCreateComponent),
    canActivate: [AuthGuard, RoleGuard('client')],
  },
  {
    path: ':id',
    loadComponent: () => import('./detail/ad-detail.component').then(m => m.AdDetailComponent),
  },
];
