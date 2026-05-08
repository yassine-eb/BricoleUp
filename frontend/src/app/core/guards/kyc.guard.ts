import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const KycGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser$();
  if (user && user.kyc_status === 'verified') return true;
  router.navigate(['/profil/kyc']);
  return false;
};
