import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 401:
            // Unauthorized - token expired or invalid
            console.error('Unauthorized - redirecting to login');
            authService.logout().subscribe({
              next: () => router.navigate(['/auth/login']),
              error: () => router.navigate(['/auth/login']),
            });
            errorMessage = 'Session expired. Please login again.';
            break;

          case 403:
            // Forbidden - insufficient permissions
            errorMessage = 'You do not have permission to access this resource.';
            console.error('Forbidden:', error.error);
            break;

          case 404:
            errorMessage = 'Resource not found.';
            break;

          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;

          default:
            errorMessage = error.error?.message || `Error Code: ${error.status}`;
        }
      }

      console.error('HTTP Error:', errorMessage, error);

      // You can show a toast/snackbar here
      // this.toastService.error(errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};
