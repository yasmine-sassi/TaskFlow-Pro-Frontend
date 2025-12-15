import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { Project, ProjectMemberRole } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]],
      color: ['#3B82F6'],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      const open = changes['isOpen'].currentValue;
      console.log('Modal isOpen changed:', open, 'isEditing:', this.isEditing);
      if (open) {
        this.loadUsers();
        // Prefill form when editing
        if (this.isEditing && this.projectToEdit) {
          this.form.patchValue({
            name: this.projectToEdit.name,
            description: this.projectToEdit.description ?? '',
            color: this.projectToEdit.color ?? '#3B82F6',
          });
          this.setSelectionsFromProject(this.projectToEdit);
        }
      }
      if (!open) {
        this.form.reset({ color: '#3B82F6' });
        this.selectedOwnerIds.set([]);
        this.selectedEditorIds.set([]);
        this.selectedViewerIds.set([]);
        this.availableUsers.set([]);
      }
    }

    if (changes['projectToEdit'] && this.isOpen && this.projectToEdit) {
      // Ensure form is patched if projectToEdit arrives after open
      this.form.patchValue({
        name: this.projectToEdit.name,
        description: this.projectToEdit.description ?? '',
        color: this.projectToEdit.color ?? '#3B82F6',
      });
      this.setSelectionsFromProject(this.projectToEdit);
    }
  }

  get isEditing(): boolean {
    return !!this.projectToEdit;
  }

  loadUsers() {
    console.log('🔍 loadUsers() called');
    const current = this.authService.currentUserSignal();
    const projectId = this.isEditing && this.projectToEdit ? this.projectToEdit.id : null;
    let src$ = this.usersService.getAllUsers();
    if (projectId) {
      if (current?.role === 'ADMIN') {
        src$ = this.usersService.getAllUsers();
      } else {
        src$ = this.usersService.getAssignableUsers(projectId);
      }
    }

    src$.subscribe({
      next: (users) => {
        console.log('✅ Users loaded successfully:', users);
        this.availableUsers.set(users);
      },
      error: (err) => {
        console.error('❌ Failed to load users:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.message,
          error: err.error
        });
      },
    });
  }

  toggleOwner(userId: string) {
    const current = this.selectedOwnerIds();
    if (current.includes(userId)) {
      this.selectedOwnerIds.set(current.filter(id => id !== userId));
    } else {
      this.selectedOwnerIds.set([...current, userId]);
    }
  }

  toggleEditor(userId: string) {
    const current = this.selectedEditorIds();
    if (current.includes(userId)) {
      this.selectedEditorIds.set(current.filter(id => id !== userId));
    } else {
      this.selectedEditorIds.set([...current, userId]);
    }
  }

  toggleViewer(userId: string) {
    const current = this.selectedViewerIds();
    if (current.includes(userId)) {
      this.selectedViewerIds.set(current.filter(id => id !== userId));
    } else {
      this.selectedViewerIds.set([...current, userId]);
    }
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
  }

  // Build desired roles map with precedence: VIEWER < EDITOR < OWNER
  private buildDesiredRoles(ownerId: string, editors: string[], viewers: string[]) {
    const desired = new Map<string, ProjectMemberRole>();
    viewers.forEach((id) => desired.set(id, ProjectMemberRole.VIEWER));
    editors.forEach((id) => desired.set(id, ProjectMemberRole.EDITOR));
    desired.set(ownerId, ProjectMemberRole.OWNER);
    return desired;
  }

  // Create add/update/remove operations to sync members
  private buildMemberOperations(projectId: string, desiredRoles: Map<string, ProjectMemberRole>) {
    const operations: Array<ReturnType<ProjectsService['addMember']> | ReturnType<ProjectsService['removeMember']> | ReturnType<ProjectsService['updateMemberRole']>> = [];
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

  // Resolve a friendly display name for a user id
  getUserName(userId: string): string {
    const user = this.availableUsers().find((u) => u.id === userId);
    return user ? `${user.firstName}` : 'User';
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

      const changedFields = (
        (this.projectToEdit.name ?? '') !== (updatePayload.name ?? '') ||
        (this.projectToEdit.description ?? '') !== (updatePayload.description ?? '') ||
        (this.projectToEdit.color ?? '') !== (updatePayload.color ?? '')
      );

      const runMemberOps = () => {
        const runMemberOps$: Observable<unknown> = memberOps.length ? forkJoin(memberOps) : of(null);
        runMemberOps$.subscribe({
          next: () => {
            this.projectsService.getProjectMembers(projectId).subscribe({
              next: (members) => {
                const base = this.projectToEdit!;
                this.projectUpdated.emit({ ...(changedFields ? base : this.projectToEdit!), ...base, members });
                this.onClose();
              },
              error: (err: unknown) => {
                console.warn('Members sync done but failed to reload members list:', err);
                this.projectUpdated.emit(this.projectToEdit!);
                this.onClose();
              },
            });
          },
          error: (err: unknown) => {
            console.error('Failed to sync members:', err);
            this.isSubmitting.set(false);
          },
        });
      };

      if (changedFields) {
        this.projectsService.updateProject(projectId, updatePayload).subscribe({
          next: (updatedProject) => {
            // After project update, sync members
            const runMemberOps$: Observable<unknown> = memberOps.length ? forkJoin(memberOps) : of(null);
            runMemberOps$.subscribe({
              next: () => {
                this.projectsService.getProjectMembers(projectId).subscribe({
                  next: (members) => {
                    this.projectUpdated.emit({ ...updatedProject, members });
                    this.onClose();
                  },
                  error: (err: unknown) => {
                    console.warn('Project updated but failed to reload members:', err);
                    this.projectUpdated.emit(updatedProject);
                    this.onClose();
                  },
                });
              },
              error: (err: unknown) => {
                console.error('Project updated but failed to sync members:', err);
                this.isSubmitting.set(false);
              },
            });
          },
          error: (err: any) => {
            console.error('Failed to update project:', err);
            // Fallback: if forbidden to update fields, still try syncing members
            if (memberOps.length) {
              runMemberOps();
            } else {
              this.isSubmitting.set(false);
            }
          },
        });
      } else {
        // No field changes; only sync members
        runMemberOps();
      }
    } else {
      // Create new project with owner/editors/viewers
      const payload = { ...formValue, ownerId, editors, viewers };

      this.projectsService.createProject(payload).subscribe({
        next: (newProject) => {
          this.projectCreated.emit(newProject);
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
}
