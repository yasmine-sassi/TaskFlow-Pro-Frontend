import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { ProfileUpdateDto } from '../models/settings.model';
import { User } from '../../../core/models/user.model';
import { FormStateService } from '../../../core/services/form-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private formState = inject(FormStateService);
  private destroyRef = inject(DestroyRef);

  private draftKey = '';

  currentUser = this.authService.currentUserSignal;
  profileForm: FormGroup;
  isSubmitting = signal(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  selectedFile: File | null = null;
  previewAvatar = signal<string | null>(null);

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: [{value: '', disabled: true}], // Email is read-only
    });

    this.draftKey = this.buildDraftKey('settings-profile');
    const saved = this.formState.restore<{ firstName: string; lastName: string; email: string }>(this.draftKey);
    if (saved) {
      this.profileForm.patchValue(saved, { emitEvent: false });
    } else {
      // Load current user data
      this.loadUserData();
    }

    this.profileForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formState.save(this.draftKey, this.profileForm.getRawValue()));
  }

  private loadUserData() {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  }

  get initials(): string {
    const user = this.currentUser();
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // Create immediate preview
      this.convertFileToBase64(this.selectedFile).then(base64 => {
        this.previewAvatar.set(base64);
      });
    }
  }

  async onSubmit() {
    if (this.profileForm.invalid) {
      this.errorMessage.set('Please fill in all required fields correctly.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const formData = { ...this.profileForm.value };

      // Handle avatar upload if selected
      if (this.selectedFile) {
        const avatarUrl = await this.convertFileToBase64(this.selectedFile);
        formData.avatar = avatarUrl;
      }

      // Update profile
      const updatedUser = await this.usersService.updateProfile(formData).toPromise();
      if (updatedUser) {
        this.authService.refreshCurrentUser(updatedUser);
        this.previewAvatar.set(null); // Clear preview after successful save
      }

      this.successMessage.set('Profile updated successfully!');
      this.formState.clear(this.draftKey);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error?.error?.message || error?.message || 'Failed to update profile. Please try again.';
      this.errorMessage.set(errorMessage);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private buildDraftKey(scope: 'settings-profile'): string {
    const userId = this.authService.getCurrentUser()?.id ?? 'anonymous';
    return `draft:${scope}:${userId}`;
  }
}