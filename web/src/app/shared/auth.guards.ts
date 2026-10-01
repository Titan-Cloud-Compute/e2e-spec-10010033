import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Requires a signed-in session. Signed-out visitors are sent to the sign-in
 * page. The session is the one AuthService restores from storage on boot and
 * sets on login; the backend still enforces auth on every /api call.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login']);
};

/**
 * Requires an ADMIN (or SUPER_ADMIN) session. Signed-out visitors go to the
 * sign-in page; signed-in non-admins go to their dashboard.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (auth.hasAdminRole()) return true;
  return router.createUrlTree(['/dashboard']);
};
