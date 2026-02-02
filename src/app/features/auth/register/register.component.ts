import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterDto } from '../../../core/models/user.model';
import { FormStateService } from '../../../core/services/form-state.service';
import {
  matchPasswordValidator,
  noSpacesValidator,
  passwordStrengthValidator,
  UniqueEmailValidator,
} from '../../../shared/validators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private uniqueEmailValidator = inject(UniqueEmailValidator);
  private destroyRef = inject(DestroyRef);
  private formState = inject(FormStateService);

  private readonly draftKey = 'draft:register';

  isSubmitting = signal(false);
  errorMessage = signal<string>('');
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);

  registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required, noSpacesValidator({ trim: true })]],
      lastName: ['', [Validators.required, noSpacesValidator({ trim: true })]],

      // Validate email in real-time (includes async unique-email check)
      email: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.email,
          noSpacesValidator({ allowInternal: false }),
        ],
        asyncValidators: [this.uniqueEmailValidator.validate()],
        updateOn: 'change', // Real-time validation
      }),

      // Validate password on blur to show strength errors after finishing typing
      password: this.fb.control('', {
        validators: [Validators.required, passwordStrengthValidator()],
        updateOn: 'blur',
      }),

      // Validate confirmPassword on blur; match handled at form level
      confirmPassword: this.fb.control('', {
        validators: [Validators.required],
        updateOn: 'blur',
      }),
    },
    { validators: matchPasswordValidator('password', 'confirmPassword') },
  );

  get firstName() {
    return this.registerForm.get('firstName')!;
  }
  get lastName() {
    return this.registerForm.get('lastName')!;
  }
  get email() {
    return this.registerForm.get('email')!;
  }
  get password() {
    return this.registerForm.get('password')!;
  }
  get confirmPassword() {
    return this.registerForm.get('confirmPassword')!;
  }

  constructor() {
    const saved = this.formState.restore<{
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
    }>(this.draftKey);
    if (saved) {
      this.registerForm.patchValue(saved, { emitEvent: false });
    }

    this.registerForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formState.save(this.draftKey, this.registerForm.getRawValue()));
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.passwordVisible.update((current) => !current);
    } else {
      this.confirmPasswordVisible.update((current) => !current);
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set('');
      const { firstName, lastName, email, password } = this.registerForm.value;
      const registerDto: RegisterDto = {
        firstName: firstName!,
        lastName: lastName!,
        email: email!,
        password: password!,
      };
      this.authService
        .register(registerDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.formState.clear(this.draftKey);
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.errorMessage.set(error.message);
            this.isSubmitting.set(false);
          },
        });
    } else {
      // Avoid forcing blur-only validators to show errors on submit
      // this.registerForm.markAllAsTouched();
    }
  }
}
