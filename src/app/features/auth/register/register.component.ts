import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterDto } from '../../../core/models/user.model';
@Component({
selector: 'app-register',
standalone: true,
imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  isSubmitting = signal(false);
  errorMessage = signal<string>('');

  registerForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  get firstName() { return this.registerForm.get('firstName')!; }
  get lastName() { return this.registerForm.get('lastName')!; }
  get email() { return this.registerForm.get('email')!; }
  get password() { return this.registerForm.get('password')!; }
  get confirmPassword() { return this.registerForm.get('confirmPassword')!; }

  onSubmit(): void {
    if (this.registerForm. valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set('');
      const { firstName, lastName, email, password } = this. registerForm.value;
      const registerDto: RegisterDto = { firstName: firstName!, lastName: lastName!, email: email!, password: password! };
      this.authService.register(registerDto).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessage.set(error. message);
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}


  function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control. get('confirmPassword');
  if (!password || !confirmPassword) {
  return null;
  }
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}