import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, catchError, switchMap, startWith } from 'rxjs/operators';
import { of, merge, firstValueFrom } from 'rxjs';
import { LabelSelectComponent } from '../label-select/label-select.component';
import { CommentSectionComponent } from '../comment-section/comment-section.component';
import { AttachmentSectionComponent } from '../attachment-section/attachment-section.component';
import {
  Task,
  TaskStatus,
  TaskPriority,
  Subtask,
  Label,
  Comment,
  Attachment,
} from '../../../core/models/task.model';
import { Project } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';
import { TasksService } from '../../../core/services/task.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthService } from '../../../core/services/auth.service';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';
import { LabelsService } from '../../../core/services/labels.service';
import { UsersService } from '../../../core/services/users.service';
import { FormStateService } from '../../../core/services/form-state.service';
import { CommentsService } from '../../../core/services/comments.service';
import { AttachmentsService } from '../../../core/services/attachments.service';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LabelSelectComponent,
    CommentSectionComponent,
    AttachmentSectionComponent,
    LucideIconComponent,
  ],
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskModalComponent implements OnInit, OnDestroy {
  @Input() task: Task | null = null;
  @Input() open = false;
  @Input() defaultProjectId?: string;
  @Output() openChange = new EventEmitter<boolean>();

  // Expose enums to template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  // Track deleted subtask IDs for backend synchronization
  deletedSubtaskIds: Set<string> = new Set();

  activeTab = 'details';

  subtasks: Subtask[] = [];
  comments: Comment[] = [];
  attachments: Attachment[] = [];

  // Services
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private tasksService = inject(TasksService);
  private projectsService = inject(ProjectsService);
  private authService = inject(AuthService);
  private labelsService = inject(LabelsService);
  private usersService = inject(UsersService);
  private formState = inject(FormStateService);
  private commentsService = inject(CommentsService);
  private attachmentsService = inject(AttachmentsService);

  private draftKey = '';
  private skipPersist = false;

  // Data
  availableProjects: Project[] = [];
  availableLabels: Label[] = [];
  assignees: User[] = [];
  currentUser: User | null = null;
  showAssigneeDropdown = signal(false);

  taskForm: FormGroup = this.fb.group(
    {
      title: this.fb.control('', {
        validators: [Validators.required, Validators.maxLength(100)],
        asyncValidators: [this.uniqueTitleValidator()],
        nonNullable: true,
      }),
      description: this.fb.control('', { nonNullable: true }),
      status: this.fb.control(TaskStatus.TODO, { nonNullable: true }),
      priority: this.fb.control(TaskPriority.MEDIUM, { nonNullable: true }),
      projectId: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
      startDate: this.fb.control<string | null>(null),
      dueDate: this.fb.control<string | null>({ value: null, disabled: true }),
      assigneesIds: this.fb.control<string[]>({ value: [], disabled: true }, { nonNullable: true }),
      labels: this.fb.control<Label[]>([], { nonNullable: true }),
      newSubtask: this.fb.control('', { nonNullable: true }),
    },
    { validators: [this.dateRangeValidator('startDate', 'dueDate')] },
  );

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue && !changes['open'].previousValue) {
      this.draftKey = this.buildDraftKey();
      this.loadData();
      // Only use draft for CREATE mode, not EDIT mode
      if (!this.isEditing && this.hasDraft()) {
        this.restoreDraft();
      } else {
        this.resetForm();
      }
    }
    if (changes['task'] && !changes['task'].firstChange) {
      this.draftKey = this.buildDraftKey();
      // Always load from server in EDIT mode, never use drafts
      this.resetForm();
    }
  }

  ngOnInit() {
    // Only set up subscriptions, NOT data initialization
    // Data initialization happens in ngOnChanges

    merge(
      this.startDateControl.valueChanges.pipe(
        map((value) => ({ type: 'startDate' as const, value }))
      ),
      this.projectIdControl.valueChanges.pipe(
        map((value) => ({ type: 'projectId' as const, value }))
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.type === 'startDate') {
          this.updateDueDateAvailability(event.value);
        } else {
          this.updateAssigneesAvailability(event.value);
        }
      });

    this.projectIdControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((projectId) => this.fetchAssignees$(projectId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((users) => {
        this.assignees = this.normalizeUsers(users);
      });

    this.taskForm.valueChanges
      .pipe(
        debounceTime(500),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saveDraft();
      });
  }

  ngOnDestroy() {
    // Only reset if editing - for create mode, preserve draft
    if (this.isEditing) {
      this.resetForm();
    }
  }

  loadData() {
    // Load current user
    this.currentUser = this.authService.currentUserSignal();

    // Load projects
    const projects = this.projectsService.projects();
    if (projects) {
      this.availableProjects = projects;
      // Only set default project if explicitly provided
      if (this.defaultProjectId && !this.projectIdControl.value) {
        this.projectIdControl.setValue(this.defaultProjectId, { emitEvent: false });
        this.updateAssigneesAvailability(this.defaultProjectId);
        // Manually fetch assignees after setting projectId
        this.fetchAssignees$(this.defaultProjectId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((users) => {
            this.assignees = this.normalizeUsers(users);
          });
      }
    }

    // Load labels
    const labels = this.labelsService.labels();
    if (labels) {
      this.availableLabels = labels;
    } else {
      // Load labels if not already loaded
      this.labelsService
        .getAllLabels()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (labels) => {
            this.availableLabels = labels;
          },
        });
    }
  }

  private fetchAssignees$(projectId: string | null | undefined) {
    if (this.currentUser?.role === 'ADMIN') {
      return this.usersService.getAllUsers();
    }

    if (projectId) {
      return this.usersService.getAssignableUsers(projectId);
    }

    return of([] as User[]);
  }

  private normalizeUsers(users: User[]): User[] {
    return (users || []).filter((u) => !!u && !!u.id);
  }

  resetForm() {
    this.skipPersist = true;
    if (this.task) {
      this.taskForm.reset(
        {
          title: this.task.title,
          description: this.task.description || '',
          status: this.task.status,
          priority: this.task.priority,
          projectId: this.task.projectId,
          startDate: this.task.startDate ? this.formatDateValue(this.task.startDate) : null,
          dueDate: this.task.dueDate ? this.formatDateValue(this.task.dueDate) : null,
          assigneesIds:
            this.task.assignees && this.task.assignees.length > 0
              ? this.task.assignees.map((a) => a.id)
              : this.currentUser
                ? [this.currentUser.id]
                : [],
          labels: [...(this.task.labels || [])],
          newSubtask: '',
        },
        { emitEvent: false },
      );
      this.updateDueDateAvailability(this.startDateControl.value);
      this.updateAssigneesAvailability(this.projectIdControl.value);
      // Explicitly fetch assignees for the task's project
      this.fetchAssignees$(this.task.projectId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((users) => {
          this.assignees = this.normalizeUsers(users);
        });
      this.subtasks = [...(this.task.subtasks || [])];
      // Load comments from backend
      this.commentsService.getCommentsByTask(this.task.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((comments) => {
          this.comments = comments;
          this.cdr.markForCheck();
        });
      // Load attachments from backend
      this.attachmentsService.getAttachmentsByTask(this.task.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((attachments) => {
          this.attachments = attachments;
          this.cdr.markForCheck();
        });
    } else {
      this.taskForm.reset(
        {
          title: '',
          description: '',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          projectId: this.defaultProjectId || '',
          startDate: null,
          dueDate: null,
          assigneesIds: [],
          labels: [],
          newSubtask: '',
        },
        { emitEvent: false },
      );
      this.updateDueDateAvailability(this.startDateControl.value);
      this.updateAssigneesAvailability(this.projectIdControl.value);
      this.subtasks = [];
      this.comments = [];
      this.attachments = [];
    }
    this.activeTab = 'details';
    this.deletedSubtaskIds.clear();
    this.skipPersist = false;
  }

  formatDateValue(date: Date | string | null | undefined): string {
    if (!date) return '';
    // Handle string dates from backend
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    // Handle Date objects
    return date.toISOString().split('T')[0];
  }

  private parseDateValue(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    // Handle both ISO strings and date strings
    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  get isEditing(): boolean {
    return !!this.task;
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    // Allow submission if form has no errors, even if async validators are pending
    if (this.taskForm.invalid && this.taskForm.status !== 'PENDING') {
      this.taskForm.markAllAsTouched();
      return;
    }

    // If still pending, wait for async validators to complete
    if (this.taskForm.status === 'PENDING') {
      await firstValueFrom(
        this.taskForm.statusChanges.pipe(
          debounceTime(100),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef),
        ),
      ).catch(() => {
        // If there's an error waiting for status, proceed anyway
      });

      // Check again after waiting
      if (this.taskForm.invalid) {
        this.taskForm.markAllAsTouched();
        return;
      }
    }

    // Prepare payloads per backend contract
    const labelIds = (this.labelsControl.value || []).map((l) => l.id).filter(Boolean);
    const startDate = this.parseDateValue(this.startDateControl.value) ?? undefined;
    const dueDate = this.parseDateValue(this.dueDateControl.value) ?? undefined;

    if (this.isEditing && this.task) {
      // Prepare subtasks for update, including deleted ones
      const subtasks = (this.subtasks || []).map((st: Subtask) => ({
        id: st.id,
        title: st.title,
        isComplete: st.isComplete,
        position: st.position,
      }));

      // Add deleted subtasks with null title to indicate deletion
      this.deletedSubtaskIds.forEach((id) => {
        subtasks.push({
          id,
          title: null as any,
          isComplete: undefined as any,
          position: undefined as any,
        });
      });

      const taskData = {
        status: this.statusControl.value,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        title: this.titleControl.value,
        description: this.descriptionControl.value,
        priority: this.priorityControl.value,
        startDate,
        dueDate,
        labelIds: labelIds.length > 0 ? labelIds : undefined,
      };

      try {
        const updatedTask = await firstValueFrom(this.tasksService.updateTask(this.task.id, taskData));
        this.formState.clear(this.draftKey);
        
        // Update service signal so all components get the updated task
        this.tasksService.tasksSignal.update((tasks) =>
          tasks.map((t) => (t.id === this.task!.id ? updatedTask : t))
        );
        
        this.task = updatedTask;
        this.openChange.emit(false);
        this.resetForm();
      } catch {
        // No-op
      }
    } else {
      const createPayload = {
        title: this.titleControl.value,
        description: this.descriptionControl.value,
        status: this.statusControl.value,
        priority: this.priorityControl.value,
        startDate,
        dueDate,
        projectId: this.projectIdControl.value,
        assigneeIds: this.assigneesIdsControl.value,
        labelIds,
      };

      try {
        await firstValueFrom(this.tasksService.createTask(createPayload as any));
        this.formState.clear(this.draftKey);
        this.openChange.emit(false);
        this.resetForm();
      } catch {
        // No-op
      }
    }
  }

  async onDelete() {
    if (this.task && confirm('Are you sure you want to delete this task?')) {
      try {
        await firstValueFrom(this.tasksService.deleteTask(this.task.id));
        this.formState.clear(this.draftKey);
        this.openChange.emit(false);
        this.resetForm();
      } catch {
        // No-op
      }
    }
  }

  onOpenChange(open: boolean) {
    this.openChange.emit(open);
    if (open) {
      this.draftKey = this.buildDraftKey();
      this.loadData();
      if (this.hasDraft()) {
        this.restoreDraft();
      } else {
        this.resetForm();
      }
    } else {
      this.resetForm();
    }
  }

  addSubtask() {
    const value = this.newSubtaskControl.value.trim();
    if (value) {
      const newSubtask: Subtask = {
        id: 'st-' + Date.now(),
        title: value,
        position: this.subtasks.length,
        isComplete: false,
        taskId: this.task?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.subtasks = [...this.subtasks, newSubtask];
      this.newSubtaskControl.setValue('');
      this.saveDraft();
    }
  }

  removeSubtask(id: string) {
    // Track deletion if it's an existing subtask (has a real ID, not a temporary one)
    if (id && !id.startsWith('st-')) {
      this.deletedSubtaskIds.add(id);
    }
    this.subtasks = this.subtasks.filter((s) => s.id !== id);
    this.saveDraft();
  }

  toggleSubtask(id: string) {
    this.subtasks = this.subtasks.map((s) =>
      s.id === id ? { ...s, isComplete: !s.isComplete } : s,
    );
    this.saveDraft();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addSubtask();
    }
  }

  onAddComment(commentData: { content: string; mentions: string[] }) {
    // Only persist to backend if task exists (edit mode)
    if (this.task?.id) {
      this.commentsService.createComment({
        taskId: this.task.id,
        content: commentData.content,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newComment) => {
          this.comments = [...this.comments, newComment];
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to add comment:', error);
        }
      });
    } else {
      // In create mode, just add to local array (will be handled after task creation)
      const newComment: Comment = {
        id: 'comment-' + Date.now(),
        content: commentData.content,
        taskId: '',
        userId: this.currentUser?.id || '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.comments = [...this.comments, newComment];
      this.saveDraft();
    }
  }

  onAddAttachment(attachmentData: {
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
  }) {
    // Only persist to backend if task exists (edit mode)
    if (this.task?.id) {
      this.attachmentsService.createAttachment({
        taskId: this.task.id,
        fileName: attachmentData.fileName,
        fileUrl: attachmentData.fileUrl,
        mimeType: attachmentData.mimeType,
        fileSize: attachmentData.fileSize,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newAttachment) => {
          this.attachments = [...this.attachments, newAttachment];
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to add attachment:', error);
        }
      });
    } else {
      // In create mode, just add to local array (will be handled after task creation)
      const newAttachment: Attachment = {
        id: 'attach-' + Date.now(),
        fileName: attachmentData.fileName,
        fileUrl: attachmentData.fileUrl,
        mimeType: attachmentData.mimeType,
        fileSize: attachmentData.fileSize,
        taskId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.attachments = [...this.attachments, newAttachment];
      this.saveDraft();
    }
  }

  onRemoveAttachment(id: string) {
    // Only delete from backend if it's a real attachment (not a temporary one)
    if (this.task?.id && id && !id.startsWith('attach-')) {
      this.attachmentsService.deleteAttachment(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.attachments = this.attachments.filter((a) => a.id !== id);
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Failed to delete attachment:', error);
          }
        });
    } else {
      // Remove from local array only (temporary attachment)
      this.attachments = this.attachments.filter((a) => a.id !== id);
      this.saveDraft();
    }
  }

  getCommentsCount(): number {
    return this.comments.length;
  }

  getAttachmentsCount(): number {
    return this.attachments.length;
  }

  // Assignee selection helpers
  toggleAssignee(userId: string) {
    const current = new Set(this.assigneesIdsControl.value);
    if (current.has(userId)) {
      current.delete(userId);
    } else {
      current.add(userId);
    }
    this.assigneesIdsControl.setValue(Array.from(current));
    this.saveDraft();
  }

  isAssigneeSelected(userId: string): boolean {
    return this.assigneesIdsControl.value.includes(userId);
  }

  getSelectedAssigneesCount(): number {
    return this.assigneesIdsControl.value.length;
  }

  getAssigneeName(userId: string): string {
    const user = this.assignees.find((u) => u.id === userId);
    if (!user) return 'User';
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || 'User';
  }

  onLabelsChange(labels: Label[]) {
    this.labelsControl.setValue(labels);
    this.saveDraft();
  }

  async onCreateLabel(payload: { name: string; color: string }) {
    try {
      const label = await firstValueFrom(this.labelsService.createLabel(payload));
      this.availableLabels = [...this.availableLabels, label];
      this.labelsControl.setValue([...this.labelsControl.value, label]);
      this.saveDraft();
    } catch {
      // No-op
    }
  }

  onFieldChange() {
    this.saveDraft();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.saveDraft();
  }

  private buildDraftKey(): string {
    const userId = this.authService.getCurrentUser()?.id ?? 'anonymous';
    const scope = this.isEditing && this.task ? `task-modal:${this.task.id}` : 'task-modal:new';
    return `draft:${scope}:${userId}`;
  }

  private hasDraft(): boolean {
    return !!this.formState.restore(this.draftKey);
  }

  private restoreDraft(): void {
    const saved = this.formState.restore<{
      formData: {
        title: string;
        description: string;
        status: TaskStatus;
        priority: TaskPriority;
        startDate: string | null;
        dueDate: string | null;
        assigneesIds: string[];
        projectId: string;
        labels: Label[];
        newSubtask: string;
      };
      subtasks: Subtask[];
      comments: Comment[];
      attachments: Attachment[];
      activeTab: string;
      deletedSubtaskIds: string[];
    }>(this.draftKey);

    if (!saved) {
      return;
    }
    this.skipPersist = true;
    this.taskForm.patchValue(
      {
        title: saved.formData.title,
        description: saved.formData.description,
        status: saved.formData.status,
        priority: saved.formData.priority,
        projectId: saved.formData.projectId,
        startDate: saved.formData.startDate ?? null,
        dueDate: saved.formData.dueDate ?? null,
        assigneesIds: saved.formData.assigneesIds ?? [],
        labels: saved.formData.labels ?? [],
        newSubtask: saved.formData.newSubtask ?? '',
      },
      { emitEvent: false },
    );
    this.updateDueDateAvailability(this.startDateControl.value);
    this.subtasks = saved.subtasks ?? [];
    this.comments = saved.comments ?? [];
    this.attachments = saved.attachments ?? [];
    this.activeTab = saved.activeTab ?? 'details';
    this.deletedSubtaskIds = new Set(saved.deletedSubtaskIds ?? []);
    this.skipPersist = false;
  }

  private saveDraft(): void {
    // Don't save if persisting is skipped or modal is closed
    if (this.skipPersist || !this.draftKey || !this.open) {
      return;
    }
    this.formState.save(this.draftKey, {
      formData: {
        ...this.taskForm.getRawValue(),
      },
      subtasks: this.subtasks,
      comments: this.comments,
      attachments: this.attachments,
      activeTab: this.activeTab,
      deletedSubtaskIds: Array.from(this.deletedSubtaskIds),
    });
  }

  private updateDueDateAvailability(startDateValue: string | null): void {
    if (startDateValue) {
      this.dueDateControl.enable({ emitEvent: false });
    } else {
      this.dueDateControl.disable({ emitEvent: false });
      this.dueDateControl.setValue(null, { emitEvent: false });
    }
  }

  private updateAssigneesAvailability(projectId: string): void {
    if (projectId) {
      this.assigneesIdsControl.enable({ emitEvent: false });
    } else {
      this.assigneesIdsControl.disable({ emitEvent: false });
      this.assigneesIdsControl.setValue([], { emitEvent: false });
    }
  }

  private dateRangeValidator(startKey: string, endKey: string) {
    return (group: FormGroup) => {
      const startValue = group.get(startKey)?.value as string | null | undefined;
      const endValue = group.get(endKey)?.value as string | null | undefined;
      const startDate = this.parseDateValue(startValue);
      const endDate = this.parseDateValue(endValue);
      if (!startDate || !endDate) return null;
      return startDate.getTime() < endDate.getTime() ? null : { dateRange: true };
    };
  }

  get titleControl() {
    return this.taskForm.get('title') as FormControl<string>;
  }

  get descriptionControl() {
    return this.taskForm.get('description') as FormControl<string>;
  }

  get statusControl() {
    return this.taskForm.get('status') as FormControl<TaskStatus>;
  }

  get priorityControl() {
    return this.taskForm.get('priority') as FormControl<TaskPriority>;
  }

  get projectIdControl() {
    return this.taskForm.get('projectId') as FormControl<string>;
  }

  get startDateControl() {
    return this.taskForm.get('startDate') as FormControl<string | null>;
  }

  get dueDateControl() {
    return this.taskForm.get('dueDate') as FormControl<string | null>;
  }

  get assigneesIdsControl() {
    return this.taskForm.get('assigneesIds') as FormControl<string[]>;
  }

  get labelsControl() {
    return this.taskForm.get('labels') as FormControl<Label[]>;
  }

  get newSubtaskControl() {
    return this.taskForm.get('newSubtask') as FormControl<string>;
  }

  get showTitleError(): boolean {
    return this.titleControl.invalid && (this.titleControl.dirty || this.titleControl.touched);
  }

  get showProjectError(): boolean {
    return (
      this.projectIdControl.invalid &&
      (this.projectIdControl.dirty || this.projectIdControl.touched)
    );
  }

  get showDateRangeError(): boolean {
    const hasError = !!this.taskForm.errors?.['dateRange'];
    return hasError && (this.startDateControl.touched || this.dueDateControl.touched);
  }

  /**
   * Async validator to check if task title is unique
   * Calls the backend to verify no other task has the same title
   */
  private uniqueTitleValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      // If no value, skip validation
      if (!control.value) {
        return of(null);
      }

      const title = control.value.trim();

      // If editing, don't validate against own title
      if (this.isEditing && this.task && this.task.title === title) {
        return of(null);
      }

      // Call backend to check if title exists, excluding current task if editing
      const excludeTaskId = this.isEditing && this.task ? this.task.id : undefined;
      return this.tasksService.isTitleTaken(title, excludeTaskId).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map((isTaken: boolean) => {
          // If title is taken, return validation error
          return isTaken ? { titleTaken: { value: title } } : null;
        }),
        catchError(() => of(null)),
      );
    };
  }
}
