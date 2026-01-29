import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FormStateService } from '../../../core/services/form-state.service';
import {
  noSpacesValidator,
  passwordStrengthValidator,
} from '../../../shared/validators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private formState = inject(FormStateService);

  private readonly draftKey = 'draft:login';

  isSubmitting = signal(false);
  errorMessage = signal<string>('');
  showPassword = signal(false);

  loginForm = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        noSpacesValidator({ allowInternal: false }),
      ],
    ],
    // Use shared password strength validator for consistency with register
    password: [
      '',
      [
        Validators.required,
        passwordStrengthValidator(),
      ],
    ],
  });

  get email() { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  constructor() {
    const saved = this.formState.restore<{ email: string; password: string }>(this.draftKey);
    if (saved) {
      this.loginForm.patchValue(saved, { emitEvent: false });
    }

    this.loginForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formState.save(this.draftKey, this.loginForm.getRawValue()));
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set('');
      const { email, password } = this.loginForm.value;
      this.authService.login(email!, password!).subscribe({
        next: () => {
          this.formState.clear(this.draftKey);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessage.set(error.message);
          this.isSubmitting.set(false);
        },
        complete: () => {
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}