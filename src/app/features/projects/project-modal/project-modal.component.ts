import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { Project, ProjectMemberRole } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';
import { FormStateService } from '../../../core/services/form-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ProjectFormDto {
  name: string;
  description?: string;
  color?: string;
  ownerId?: string;
  editors?: string[];
  viewers?: string[];
}

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-modal.component.html',
  styleUrl: './project-modal.component.css',
})
export class ProjectModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() projectToEdit: Project | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() projectCreated = new EventEmitter<Project>();
  @Output() projectUpdated = new EventEmitter<Project>();

  private fb = inject(FormBuilder);
  private projectsService = inject(ProjectsService);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private formState = inject(FormStateService);
  private destroyRef = inject(DestroyRef);

  private draftKey = '';
  private skipPersist = false;

  form: FormGroup;
  isSubmitting = signal(false);
  colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#EF4444', '#06B6D4', '#EAB308'];
  
  // Member selection by role
  availableUsers = signal<User[]>([]);
  selectedOwnerIds = signal<string[]>([]);
  selectedEditorIds = signal<string[]>([]);
  selectedViewerIds = signal<string[]>([]);
  showOwnerDropdown = signal(false);
  showEditorDropdown = signal(false);
  showViewerDropdown = signal(false);

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)], [this.uniqueProjectNameValidator.bind(this)]],
      description: ['', [Validators.maxLength(500)]],
      color: ['#3B82F6'],
    });

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saveDraft());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      const open = changes['isOpen'].currentValue;
      if (open) {
        this.draftKey = this.buildDraftKey();
        this.restoreDraft();
        this.loadUsers();
        // Prefill form when editing
        if (this.isEditing && this.projectToEdit && !this.hasDraft()) {
          this.form.patchValue({
            name: this.projectToEdit.name,
            description: this.projectToEdit.description ?? '',
            color: this.projectToEdit.color ?? '#3B82F6',
          }, { emitEvent: false });
          this.setSelectionsFromProject(this.projectToEdit);
        }
      }
      if (!open) {
        this.skipPersist = true;
        this.form.reset({ color: '#3B82F6' }, { emitEvent: false });
        this.selectedOwnerIds.set([]);
        this.selectedEditorIds.set([]);
        this.selectedViewerIds.set([]);
        this.availableUsers.set([]);
        this.skipPersist = false;
        // Note: Don't clear draft here - let user resume their work when reopening
        // Draft will be cleared on successful submit or when switching modes
      }
    }

    if (changes['projectToEdit'] && this.isOpen) {
      // Update draft key when edit mode changes
      const oldDraftKey = this.draftKey;
      this.draftKey = this.buildDraftKey();
      
      // Clear old draft if it's different from new draft (e.g., switching from edit Project ABC to create new)
      if (oldDraftKey && oldDraftKey !== this.draftKey) {
        this.formState.clear(oldDraftKey);
      }
      
      // Restore draft for the new mode
      this.restoreDraft();
      
      // Prefill form when editing and no saved draft exists
      if (this.projectToEdit && !this.hasDraft()) {
        this.form.patchValue({
          name: this.projectToEdit.name,
          description: this.projectToEdit.description ?? '',
          color: this.projectToEdit.color ?? '#3B82F6',
        }, { emitEvent: false });
        this.setSelectionsFromProject(this.projectToEdit);
      }
    }
  }

  get isEditing(): boolean {
    return !!this.projectToEdit;
  }

  loadUsers() {
    const currentUser = this.authService.currentUserSignal();
    const projectId = this.isEditing && this.projectToEdit ? this.projectToEdit.id : null;
    
    if (currentUser?.role === 'ADMIN') {
      this.usersService.getAllUsers().subscribe({
        next: (users) => {
          this.availableUsers.set(users);
        },
        error: (err) => {
          console.error('Failed to load users:', err);
        },
      });
    } else if (projectId) {
      // For non-admins, use getAssignableUsers
      this.usersService.getAssignableUsers(projectId).subscribe({
        next: (users) => {
          this.availableUsers.set(users);
        },
        error: (err) => {
          console.error('Failed to load assignable users:', err);
        },
      });
    } else {
      // For creating new project as non-admin, only show current user
      if (currentUser) {
        this.availableUsers.set([currentUser]);
        // Auto-select current user as owner
        this.selectedOwnerIds.set([currentUser.id]);
      }
    }
  }

  toggleOwner(userId: string) {
    const current = this.selectedOwnerIds();
    if (current.includes(userId)) {
      this.selectedOwnerIds.set(current.filter(id => id !== userId));
    } else {
      this.selectedOwnerIds.set([...current, userId]);
    }
    this.saveDraft();
  }

  toggleEditor(userId: string) {
    const current = this.selectedEditorIds();
    if (current.includes(userId)) {
      this.selectedEditorIds.set(current.filter(id => id !== userId));
    } else {
      this.selectedEditorIds.set([...current, userId]);
    }
    this.saveDraft();
  }

  toggleViewer(userId: string) {
    const current = this.selectedViewerIds();
    if (current.includes(userId)) {
      this.selectedViewerIds.set(current.filter(id => id !== userId));
    } else {
      this.selectedViewerIds.set([...current, userId]);
    }
    this.saveDraft();
  }

  isOwnerSelected(userId: string): boolean {
    return this.selectedOwnerIds().includes(userId);
  }

  isEditorSelected(userId: string): boolean {
    return this.selectedEditorIds().includes(userId);
  }

  isViewerSelected(userId: string): boolean {
    return this.selectedViewerIds().includes(userId);
  }

  private setSelectionsFromProject(project: Project) {
    this.skipPersist = true;
    const members = project.members ?? [];
    const ownerIds = members
      .filter((m) => m.role === ProjectMemberRole.OWNER)
      .map((m) => m.userId);
    const editorIds = members
      .filter((m) => m.role === ProjectMemberRole.EDITOR)
      .map((m) => m.userId);
    const viewerIds = members
      .filter((m) => m.role === ProjectMemberRole.VIEWER)
      .map((m) => m.userId);

    // Fallback to project.ownerId if members are not populated with owners
    if (ownerIds.length === 0 && project.ownerId) {
      ownerIds.push(project.ownerId);
    }

    this.selectedOwnerIds.set(ownerIds);
    this.selectedEditorIds.set(editorIds);
    this.selectedViewerIds.set(viewerIds);
    this.skipPersist = false;
  }

  private buildDesiredRoles(ownerId: string, editors: string[], viewers: string[]) {
    const desired = new Map<string, ProjectMemberRole>();
    viewers.forEach((id) => desired.set(id, ProjectMemberRole.VIEWER));
    editors.forEach((id) => desired.set(id, ProjectMemberRole.EDITOR));
    desired.set(ownerId, ProjectMemberRole.OWNER);
    return desired;
  }

  private buildMemberOperations(projectId: string, desiredRoles: Map<string, ProjectMemberRole>) {
    const operations: Array<any> = [];
    const existingMembers = this.projectToEdit?.members ?? [];
    const existingMap = new Map(existingMembers.map((m) => [m.userId, m]));

    desiredRoles.forEach((role, userId) => {
      const existing = existingMap.get(userId);
      if (!existing) {
        operations.push(this.projectsService.addMember(projectId, { userId, role }));
      } else if (existing.role !== role) {
        operations.push(this.projectsService.updateMemberRole(projectId, existing.id, { role }));
      }
      existingMap.delete(userId);
    });

    existingMap.forEach((member) => {
      operations.push(this.projectsService.removeMember(projectId, member.id));
    });

    return operations;
  }

  getUserName(userId: string): string {
    const users = this.getAvailableUsers(); // Use safe getter
    if (users.length === 0) return 'User';
    const user = users.find((u) => u.id === userId);
    if (!user) return 'User';
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || 'User';
  }

  getSelectedOwnersCount(): number {
    return this.selectedOwnerIds().length;
  }

  getSelectedEditorsCount(): number {
    return this.selectedEditorIds().length;
  }

  getSelectedViewersCount(): number {
    return this.selectedViewerIds().length;
  }

  // Safe access to available users
  getAvailableUsers(): User[] {
    const users = this.availableUsers();
    // Ensure we always return an array
    if (!users) return [];
    if (!Array.isArray(users)) {
      console.warn('⚠️ availableUsers is not an array:', users);
      return [];
    }
    return users;
  }

  isUsersLoading(): boolean {
    const users = this.availableUsers();
    return !users || users.length === 0;
  }

  getColorName(hexColor: string): string {
    const colorMap: Record<string, string> = {
      '#3B82F6': 'Blue',
      '#8B5CF6': 'Purple',
      '#EC4899': 'Pink',
      '#10B981': 'Green',
      '#F97316': 'Orange',
      '#EF4444': 'Red',
      '#06B6D4': 'Cyan',
      '#EAB308': 'Yellow',
    };
    return colorMap[hexColor] || 'Color';
  }

  onSubmit() {
    if (!this.form.valid) return;

    this.isSubmitting.set(true);
    const formValue = this.form.value as ProjectFormDto;
    const ownerId = this.selectedOwnerIds()[0] || this.projectToEdit?.ownerId;
    const editors = this.selectedEditorIds();
    const viewers = this.selectedViewerIds();

    if (!ownerId) {
      console.warn('Owner is required to save project');
      this.isSubmitting.set(false);
      return;
    }

    if (this.isEditing && this.projectToEdit) {
      const projectId = this.projectToEdit.id;
      const updatePayload: ProjectFormDto = {
        name: formValue.name,
        description: formValue.description,
        color: formValue.color,
      };

      const desiredRoles = this.buildDesiredRoles(ownerId, editors, viewers);
      const memberOps = this.buildMemberOperations(projectId, desiredRoles);

      // Check if project fields changed
      const projectFieldsChanged = (
        (this.projectToEdit.name ?? '') !== (updatePayload.name ?? '') ||
        (this.projectToEdit.description ?? '') !== (updatePayload.description ?? '') ||
        (this.projectToEdit.color ?? '') !== (updatePayload.color ?? '')
      );

      const runMemberOperations = () => {
        if (memberOps.length === 0) {
          return of([] as any[]);
        }
        return forkJoin(memberOps);
      };

      if (projectFieldsChanged) {
        // Update project and then members
        this.projectsService.updateProject(projectId, updatePayload).subscribe({
          next: (updatedProject) => {
            runMemberOperations().subscribe({
              next: () => {
                // Reload members and emit updated project
                  this.projectsService.getProjectById(projectId).subscribe({
                    next: (projectWithMembers) => {
                      this.projectUpdated.emit(projectWithMembers);
                      this.onClose();
                    },
                    error: (err: any) => {
                      console.warn('Project updated but failed to reload members:', err);
                      this.projectUpdated.emit(updatedProject);
                      this.onClose();
                    },
                  });
              },
              error: (err: any) => {
                console.error('Failed to sync members:', err);
                this.isSubmitting.set(false);
              },
            });
          },
          error: (err) => {
            console.error('Failed to update project:', err);
            this.isSubmitting.set(false);
          },
        });
      } else {
        // Only update members
        runMemberOperations().subscribe({
          next: () => {
            // Reload the project with updated members
            this.projectsService.getProjectById(projectId).subscribe({
              next: (updatedProject) => {
                this.projectUpdated.emit(updatedProject);
                this.onClose();
              },
              error: (err) => {
                console.error('Failed to reload project:', err);
                this.isSubmitting.set(false);
              },
            });
          },
          error: (err: any) => {
            console.error('Failed to sync members:', err);
            this.isSubmitting.set(false);
          },
        });
      }
    } else {
      // Create new project
      const payload = { 
        ...formValue, 
        ownerId, 
        editors, 
        viewers 
      };

      this.projectsService.createProject(payload).subscribe({
        next: (newProject) => {
          this.projectCreated.emit(newProject);
          this.formState.clear(this.draftKey);
          this.onClose();
        },
        error: (err) => {
          console.error('Failed to create project:', err);
          this.isSubmitting.set(false);
        },
      });
    }
  }

  onClose() {
    this.isSubmitting.set(false);
    this.close.emit();
  }

  private buildDraftKey(): string {
    const userId = this.authService.getCurrentUser()?.id ?? 'anonymous';
    const scope = this.isEditing && this.projectToEdit ? `project-modal:${this.projectToEdit.id}` : 'project-modal:new';
    return `draft:${scope}:${userId}`;
  }

  private hasDraft(): boolean {
    return !!this.formState.restore(this.draftKey);
  }

  private restoreDraft(): void {
    const saved = this.formState.restore<{
      form: { name: string; description?: string; color?: string };
      owners: string[];
      editors: string[];
      viewers: string[];
    }>(this.draftKey);

    if (!saved) return;
    this.skipPersist = true;
    this.form.patchValue(saved.form, { emitEvent: false });
    this.selectedOwnerIds.set(saved.owners ?? []);
    this.selectedEditorIds.set(saved.editors ?? []);
    this.selectedViewerIds.set(saved.viewers ?? []);
    this.skipPersist = false;
  }

  private saveDraft(): void {
    if (this.skipPersist || !this.isOpen) return;
    this.formState.save(this.draftKey, {
      form: this.form.getRawValue(),
      owners: this.selectedOwnerIds(),
      editors: this.selectedEditorIds(),
      viewers: this.selectedViewerIds(),
    });
  }

  /**
   * Async validator to check if project name is unique
   * Calls the backend to verify no other project has the same name
   */
  private uniqueProjectNameValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    // If no value, skip validation
    if (!control.value) {
      return of(null);
    }

    const projectName = control.value.trim();

    // If editing, don't validate against own name
    if (this.isEditing && this.projectToEdit && this.projectToEdit.name === projectName) {
      return of(null);
    }

    // Call backend to check if name exists, excluding current project if editing
    const excludeProjectId = this.isEditing && this.projectToEdit ? this.projectToEdit.id : undefined;
    return this.projectsService.checkProjectNameExists(projectName, excludeProjectId).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map((exists: boolean) => {
        // If name exists, return validation error
        return exists ? { uniqueProjectName: { value: projectName } } : null;
      }),
      catchError(() => {
        // If API call fails, allow the submission to proceed
        console.warn('Failed to validate project name uniqueness');
        return of(null);
      })
    );
  }
}
