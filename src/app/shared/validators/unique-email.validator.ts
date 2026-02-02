import { inject, Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../../core/tokens/api-config.token';

/**
 * UNIQUE EMAIL ASYNC VALIDATOR
 * 
 * Validates that an email address is not already registered.
 * This is an ASYNC validator - it makes an HTTP request to the backend.
 * 
 * Features:
 * - Debounces API calls (waits 500ms after user stops typing)
 * - Shows loading state while checking
 * - Caches results to avoid duplicate API calls
 * 
 * Usage:
 * ```typescript
 * @Component({...})
 * export class RegisterComponent {
 *   private uniqueEmailValidator = inject(UniqueEmailValidator);
 * 
 *   registerForm = this.fb.group({
 *     email: ['', 
 *       [Validators.required, Validators.email],
 *       [this.uniqueEmailValidator.validate.bind(this.uniqueEmailValidator)]
 *     ]
 *   });
 * }
 * ```
 * 
 * Check validation state in template:
 * ```html
 * <input formControlName="email" />
 * <div *ngIf="email.pending">Checking availability...</div>
 * <div *ngIf="email.hasError('emailTaken')">Email is already registered</div>
 * ```
 * 
 * IMPORTANT: For this to work, you need a backend endpoint:
 * GET /auth/check-email?email=test@example.com
 * Returns: { available: boolean }
 */

@Injectable({
  providedIn: 'root',
})
export class UniqueEmailValidator {
  private http = inject(HttpClient);
  private apiConfig = inject(API_CONFIG);
  private cache = new Map<string, boolean>(); // Cache to avoid duplicate API calls

  /**
   * Create validator function
   * @param debounceTime - Milliseconds to wait before making API call (default: 500ms)
   */
  validate(debounceTime: number = 500): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;

      // Skip validation if email is empty or invalid format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return of(null);
      }

      // Check cache first
      if (this.cache.has(email)) {
        const isAvailable = this.cache.get(email)!;
        return of(isAvailable ? null : { emailTaken: true });
      }

      // Debounce the API call
      return timer(debounceTime).pipe(
        switchMap(() => this.checkEmailAvailability(email)),
        map((isAvailable) => {
          this.cache.set(email, isAvailable); // Cache the result
          return isAvailable ? null : { emailTaken: true };
        }),
        catchError(() => {
          // If API call fails, don't block the form
          console.warn('Email availability check failed');
          return of(null);
        })
      );
    };
  }

  /**
   * Check email availability via API
   * Calls backend endpoint: GET /auth/check-email?email=...
   * Returns whether the email is available (not taken)
   */
  private checkEmailAvailability(email: string): Observable<boolean> {
    const apiUrl = `${this.apiConfig.apiUrl}/auth/check-email?email=${encodeURIComponent(email)}`;
    console.log('Checking email availability:', apiUrl);
    
    return this.http.get<any>(apiUrl).pipe(
      map(response => {
        console.log('Email check response:', response);
        // Handle both direct response and wrapped response format
        const available = response.data?.available !== undefined ? response.data.available : response.available;
        console.log('Email available:', available);
        return available;
      }),
      catchError((error) => {
        console.warn('Email availability check failed:', error);
        // If API call fails, don't block the form
        return of(true);
      })
    );
  }

  /**
   * Clear cache (useful when form is reset)
   */
  clearCache(): void {
    this.cache.clear();
  }
}