import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  noSpacesValidator,
  UniqueEmailValidator,
} from '../../../shared/validators';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-form.component.html',
})
export class ProjectFormComponent {
  private fb = inject(FormBuilder);
  private uniqueEmailValidator = inject(UniqueEmailValidator);
  private projectsService = inject(ProjectsService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  projectForm: FormGroup = this.fb.group({
    name: this.fb.control('', {
      validators: [Validators.required, noSpacesValidator({ trim: true })],
      updateOn: 'blur',
    }),
    description: this.fb.control('', { updateOn: 'blur' }),
    color: this.fb.control('#3B82F6', { validators: [Validators.required], updateOn: 'blur' }),
    members: this.fb.array<FormControl<string>>([]),
  });

  get name() { return this.projectForm.get('name') as FormControl<string>; }
  get description() { return this.projectForm.get('description') as FormControl<string>; }
  get color() { return this.projectForm.get('color') as FormControl<string>; }
  get members() { return this.projectForm.get('members') as FormArray<FormControl<string>>; }

  constructor() {
    this.projectForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.errorMessage()) {
          this.errorMessage.set(null);
        }
      });

    this.projectForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        console.log('Form status:', status);
      });
  }

  addMember(): void {
    const control = this.fb.control<string>('', {
      validators: [Validators.required, Validators.email, noSpacesValidator({ allowInternal: false })],
      asyncValidators: [this.uniqueEmailValidator.validate(400)],
      updateOn: 'blur',
      nonNullable: true,
    });
    this.members.push(control);
  }

  removeMember(index: number): void {
    this.members.removeAt(index);
  }

  closeModal(): void {
    this.router.navigate(['/projects']);
  }

  resetForm(): void {
    this.projectForm.reset({ color: '#3B82F6' });
    this.members.clear();
    this.uniqueEmailValidator.clearCache();
    this.errorMessage.set(null);
  }

  submit(): void {
    if (this.projectForm.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set(null);

      const user = this.authService.getCurrentUser();
      if (!user) {
        this.errorMessage.set('User not authenticated');
        this.isSubmitting.set(false);
        return;
      }

      const formValue = this.projectForm.value;

      const createProjectDto = {
        name: formValue.name,
        description: formValue.description || undefined,
        color: formValue.color,
        ownerId: user.id,
      };

      this.projectsService.createProject(createProjectDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (project) => {
            console.log('Project created successfully:', project);
            this.isSubmitting.set(false);
            this.router.navigate(['/projects']);
          },
          error: (error) => {
            console.error('Failed to create project:', error);
            this.errorMessage.set(error?.error?.message || 'Failed to create project. Please try again.');
            this.isSubmitting.set(false);
          },
        });
    }
  }
}