import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LabelSelectComponent } from '../label-select/label-select.component';
import { CommentSectionComponent } from '../comment-section/comment-section.component';
import { AttachmentSectionComponent } from '../attachment-section/attachment-section.component';
import { Task, TaskStatus, TaskPriority, Subtask, Label, Comment, Attachment } from '../../../core/models/task.model';
import { Project } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';
import { TasksService } from '../../../core/services/task.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthService } from '../../../core/services/auth.service';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';
import { LabelsService } from '../../../core/services/labels.service';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LabelSelectComponent,
    CommentSectionComponent,
    AttachmentSectionComponent,
    LucideIconComponent
  ],
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.css']
})
export class TaskModalComponent implements OnInit, OnDestroy {
  @Input() task: Task | null = null;
  @Input() open = false;
  @Input() defaultProjectId?: string;
  @Output() openChange = new EventEmitter<boolean>();
  
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;
  
  // Expose enums to template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;
  
  // Form state
  formData = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date(),
    assigneesIds: [] as string[],
    projectId: '',
    subtasks: [] as Subtask[],
    labels: [] as Label[],
    comments: [] as Comment[],
    attachments: [] as Attachment[],
  };
  
  // Track deleted subtask IDs for backend synchronization
  deletedSubtaskIds: Set<string> = new Set();
  
  errors: Record<string, string> = {};
  newSubtask = '';
  activeTab = 'details';
  
  // Services
  private tasksService = inject(TasksService);
  private projectsService = inject(ProjectsService);
  private authService = inject(AuthService);
  private labelsService = inject(LabelsService);
  private usersService = inject(UsersService);
  
  // Data
  availableProjects: Project[] = [];
  availableLabels: Label[] = [];
  assignees: User[] = [];
  currentUser: User | null = null;
  showAssigneeDropdown = signal(false);
  
  constructor() {}
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue && !changes['open'].previousValue) {
      this.loadData();
      this.resetForm();
    }
    if (changes['task'] && !changes['task'].firstChange) {
      // Reset form when a new task is passed in
      this.resetForm();
    }
  }

  ngOnInit() {
    this.loadData();
    this.resetForm();
  }
  
  ngOnDestroy() {
    this.resetForm();
  }
  
  loadData() {
    // Load current user
    this.currentUser = this.authService.currentUserSignal();
    
    // Load projects
    const projects = this.projectsService.projects();
    if (projects) {
      this.availableProjects = projects;
      if (this.availableProjects.length > 0 && !this.formData.projectId) {
        this.formData.projectId = this.defaultProjectId || this.availableProjects[0].id;
      }
    }
    
    // Load labels
    const labels = this.labelsService.labels();
    if (labels) {
      this.availableLabels = labels;
    } else {
      // Load labels if not already loaded
      this.labelsService.getAllLabels().subscribe({
        next: (labels) => {
          this.availableLabels = labels;
        }
      });
    }
    
    // Load users/assignees
    this.loadAssignees();
  }
  
  loadAssignees() {
    if (this.currentUser?.role === 'ADMIN') {
      // Load all users for admin
      this.usersService.getAllUsers().subscribe({
        next: (users) => {
          this.assignees = this.normalizeUsers(users);
        }
      });
    } else if (this.formData.projectId) {
      // Load assignable users for the project
      this.usersService.getAssignableUsers(this.formData.projectId).subscribe({
        next: (users) => {
          this.assignees = this.normalizeUsers(users);
          if (this.assignees.length > 0 && !this.formData.assigneesIds.length) {
            this.formData.assigneesIds = this.assignees.map(u => u.id);
          }
        }
      });
    } else {
      // Default to current user
      if (this.currentUser) {
        this.assignees = [this.currentUser];
        this.formData.assigneesIds = [this.currentUser.id];
      }
    }
  }

  private normalizeUsers(users: User[]): User[] {
    return (users || []).filter(u => !!u && !!u.id);
  }
  
  resetForm() {
    if (this.task) {
      this.formData = {
        title: this.task.title,
        description: this.task.description || '',
        status: this.task.status,
        priority: this.task.priority,
        dueDate: this.task.dueDate || new Date(),
        assigneesIds: this.task.assignees && this.task.assignees.length > 0 ? this.task.assignees.map(a => a.id) : (this.currentUser ? [this.currentUser.id] : []),
        projectId: this.task.projectId,
        subtasks: [...(this.task.subtasks || [])],
        labels: [...(this.task.labels || [])],
        comments: [...(this.task.comments || [])],
        attachments: [...(this.task.attachments || [])],
      };
      
      // Load assignees for this project
      this.loadAssignees();
    } else {
      this.formData = {
        title: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(),
        assigneesIds: this.currentUser ? [this.currentUser.id] : [],
        projectId: this.defaultProjectId || '',
        subtasks: [],
        labels: [],
        comments: [],
        attachments: [],
      };
    }
    this.errors = {};
    this.newSubtask = '';
    this.activeTab = 'details';
    this.deletedSubtaskIds.clear();
  }
  
  onProjectChange() {
    // When project changes, reload assignees for that project
    this.loadAssignees();
  }
  
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  parseDate(dateString: string): Date {
    return new Date(dateString);
  }
  
  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.formData.dueDate = new Date(input.value);
  }
  
  get isEditing(): boolean {
    return !!this.task;
  }
  
  validate(): boolean {
    this.errors = {};
    
    if (!this.formData.title.trim()) {
      this.errors['title'] = 'Title is required';
    }
    
    if (this.formData.title.length > 100) {
      this.errors['title'] = 'Title must be less than 100 characters';
    }
    
    if (!this.formData.projectId) {
      this.errors['projectId'] = 'Project is required';
    }
    
    return Object.keys(this.errors).length === 0;
  }
  
  onSubmit(event: Event) {
    event.preventDefault();
    
    if (!this.validate()) {
      return;
    }
    
    // Prepare payloads per backend contract
    const labelIds = (this.formData.labels || []).map(l => l.id).filter(Boolean);

    if (this.isEditing && this.task) {
      // Prepare subtasks for update, including deleted ones
      const subtasks = (this.formData.subtasks || []).map(st => ({
        id: st.id,
        title: st.title,
        isComplete: st.isComplete,
        position: st.position,
      }));

      // Add deleted subtasks with null title to indicate deletion
      this.deletedSubtaskIds.forEach(id => {
        subtasks.push({
          id,
          title: null as any,
          isComplete: undefined as any,
          position: undefined as any,
        });
      });

      const taskData = {
        status: this.formData.status,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        ...(!(
          (this.task?.assignees || []).some(a => a.id === this.currentUser?.id) &&
          this.currentUser?.role === 'USER'
        ) && {
          title: this.formData.title,
          description: this.formData.description,
          priority: this.formData.priority,
          dueDate: this.formData.dueDate,
          labelIds: labelIds.length > 0 ? labelIds : undefined,
        }),
      };

      this.tasksService.updateTask(this.task.id, taskData).subscribe({
        next: () => {
          this.openChange.emit(false);
          this.resetForm();
        },
        error: (error) => {
          console.error('Failed to update task:', error);
        }
      });
    } else {
      const createPayload = {
        title: this.formData.title,
        description: this.formData.description,
        status: this.formData.status,
        priority: this.formData.priority,
        dueDate: this.formData.dueDate,
        projectId: this.formData.projectId,
        assigneeIds: this.formData.assigneesIds,
        labelIds,
      };

      this.tasksService.createTask(createPayload as any).subscribe({
        next: () => {
          this.openChange.emit(false);
          this.resetForm();
        },
        error: (error) => {
          console.error('Failed to create task:', error);
        }
      });
    }
  }
  
  onDelete() {
    if (this.task && confirm('Are you sure you want to delete this task?')) {
      this.tasksService.deleteTask(this.task.id).subscribe({
        next: () => {
          this.openChange.emit(false);
          this.resetForm();
        },
        error: (error) => {
          console.error('Failed to delete task:', error);
        }
      });
    }
  }
  
  onOpenChange(open: boolean) {
    this.openChange.emit(open);
    if (open) {
      setTimeout(() => {
        this.titleInput?.nativeElement?.focus();
      }, 100);
      this.loadData();
    } else {
      this.resetForm();
    }
  }
  
  addSubtask() {
    if (this.newSubtask.trim()) {
      const newSubtask: Subtask = {
        id: 'st-' + Date.now(),
        title: this.newSubtask.trim(),
        position: this.formData.subtasks.length,
        isComplete: false,
        taskId: this.task?.id || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.formData.subtasks = [...this.formData.subtasks, newSubtask];
      this.newSubtask = '';
    }
  }
  
  removeSubtask(id: string) {
    // Track deletion if it's an existing subtask (has a real ID, not a temporary one)
    if (id && !id.startsWith('st-')) {
      this.deletedSubtaskIds.add(id);
    }
    this.formData.subtasks = this.formData.subtasks.filter(s => s.id !== id);
  }
  
  toggleSubtask(id: string) {
    this.formData.subtasks = this.formData.subtasks.map(s =>
      s.id === id ? { ...s, isComplete: !s.isComplete } : s
    );
  }
  
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addSubtask();
    }
  }
  
  onAddComment(commentData: { content: string; mentions: string[] }) {
    const newComment: Comment = {
      id: 'comment-' + Date.now(),
      content: commentData.content,
      taskId: this.task?.id || '',
      userId: this.currentUser?.id || '1',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.formData.comments = [...this.formData.comments, newComment];
  }
  
  onAddAttachment(attachmentData: { fileName: string; fileUrl: string; mimeType: string; fileSize: number }) {
    const newAttachment: Attachment = {
      id: 'attach-' + Date.now(),
      fileName: attachmentData.fileName,
      fileUrl: attachmentData.fileUrl,
      mimeType: attachmentData.mimeType,
      fileSize: attachmentData.fileSize,
      taskId: this.task?.id || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.formData.attachments = [...this.formData.attachments, newAttachment];
  }
  
  onRemoveAttachment(id: string) {
    this.formData.attachments = this.formData.attachments.filter(a => a.id !== id);
  }
  
  getCommentsCount(): number {
    return this.formData.comments.length;
  }
  
  getAttachmentsCount(): number {
    return this.formData.attachments.length;
  }

  // Assignee selection helpers
  toggleAssignee(userId: string) {
    const current = new Set(this.formData.assigneesIds);
    if (current.has(userId)) {
      current.delete(userId);
    } else {
      current.add(userId);
    }
    this.formData.assigneesIds = Array.from(current);
  }

  isAssigneeSelected(userId: string): boolean {
    return this.formData.assigneesIds.includes(userId);
  }

  getSelectedAssigneesCount(): number {
    return this.formData.assigneesIds.length;
  }

  getAssigneeName(userId: string): string {
    const user = this.assignees.find(u => u.id === userId);
    if (!user) return 'User';
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || 'User';
  }
  
}