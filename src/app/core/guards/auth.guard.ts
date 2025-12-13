import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;
  console.log('User not authenticated, redirecting to login. Return URL:', returnUrl);

  // Redirect to login with return URL
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl },
  });

  return false;
};
