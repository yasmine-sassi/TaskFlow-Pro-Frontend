import { inject, Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError, debounceTime } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

/**
 * CURRENT PASSWORD ASYNC VALIDATOR
 * 
 * Validates that the provided current password matches the user's actual password.
 * This is an ASYNC validator - it makes an HTTP request to the backend.
 * 
 * Features:
 * - Debounces API calls (waits 500ms after user stops typing)
 * - Shows loading state while checking
 * - Caches results to avoid duplicate API calls
 * - Validates only when the password field is not empty
 * 
 * Usage:
 * ```typescript
 * @Component({...})
 * export class SecurityComponent {
 *   private currentPasswordValidator = inject(CurrentPasswordValidator);
 * 
 *   passwordForm = this.fb.group({
 *     currentPassword: ['', 
 *       [Validators.required],
 *       [this.currentPasswordValidator.validate.bind(this.currentPasswordValidator)]
 *     ],
 *     ...
 *   });
 * }
 * ```
 * 
 * Check validation state in template:
 * ```html
 * <input formControlName="currentPassword" />
 * <div *ngIf="currentPassword.pending">Verifying password...</div>
 * <div *ngIf="currentPassword.hasError('incorrectPassword')">Current password is incorrect</div>
 * ```
 */

@Injectable({
  providedIn: 'root',
})
export class CurrentPasswordValidator {
  private authService = inject(AuthService);
  private cache = new Map<string, boolean>(); // Cache to avoid duplicate API calls

  validate(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value;

      if (!value) {
        return of(null); // Don't validate empty values
      }

      // Return cached result if available
      if (this.cache.has(value)) {
        const isValid = this.cache.get(value);
        return of(isValid ? null : { incorrectPassword: true });
      }

      // Use debounceTime operator instead of timer for better RxJS patterns
      return of(value).pipe(
        debounceTime(500),
        switchMap((password) => this.authService.verifyCurrentPassword(password)),
        map((isValid: boolean) => {
          this.cache.set(value, isValid);
          return isValid ? null : { incorrectPassword: true };
        }),
        catchError((error) => {
          console.error('Password verification error:', error);
          // Don't show validation error on network failure, let submission handle it
          return of(null);
        })
      );
    };
  }
}

