import { Routes } from '@angular/router';

export const MESSAGING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./chat.component').then(m => m.ChatComponent),
  },
];
