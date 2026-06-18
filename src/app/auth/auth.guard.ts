import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Require any logged-in user */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};

/** Redirect to rooms if already logged in (for login/signup pages) */
export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).createUrlTree(['/rooms']) : true;
};

/** Require staff role */
export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isStaff()) return true;
  return inject(Router).createUrlTree(['/rooms']);
};
