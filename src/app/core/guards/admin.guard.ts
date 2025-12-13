import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  // Check if user is authenticated and is ADMIN
  if (user && user.role === UserRole.ADMIN) {
    return true;
  }

  // User is not admin, redirect to dashboard
  console.warn('Access denied: User is not an admin');
  router.navigate(['/dashboard'], {
    queryParams: { error: 'admin-only' },
  });

  return false;
};
