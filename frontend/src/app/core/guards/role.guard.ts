import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function RoleGuard(role: 'client' | 'prestataire'): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser$();
    if (user && user.role === role) return true;
    router.navigate(['/']);
    return false;
  };
}
