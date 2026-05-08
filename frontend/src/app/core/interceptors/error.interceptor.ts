import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, catchError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notif = inject(NotificationService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 400) {
        const msg = err.error?.error || 'Données invalides. Vérifiez le formulaire.';
        notif.showError(msg);
      } else if (err.status === 403) {
        notif.showError('Accès refusé. Vous n\'avez pas les droits nécessaires.');
      } else if (err.status === 500) {
        notif.showError('Erreur serveur. Veuillez réessayer plus tard.');
      }
      return throwError(() => err);
    }),
  );
};
