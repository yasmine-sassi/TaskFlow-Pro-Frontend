// task-card.component.ts
import { Component, input, output, computed, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskStatus, Subtask } from '../../../core/models/task.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, PriorityBadgeComponent],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css']
})
export class TaskCardComponent {
  // Inputs
  task = input.required<Task>();
  showProject = input(false);
  isDragging = input(false);
  project = input<{ name: string; color: string } | null>(null);
  
  // Outputs
  cardClick = output<void>();
  updateTask = output<Partial<Task>>();
  
  // State
  commentOpen = signal(false);
  commentText = signal('');
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  // Computed properties
  completedSubtasks = computed(() => 
    this.task().subtasks?.filter(s => s.isComplete).length || 0
  );
  
  dueDateClass = computed(() => {
    const dueDate = this.task().dueDate;
    if (!dueDate) return 'text-muted-foreground';
    
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const isOverdue = date < today && this.task().status !== TaskStatus.DONE;
    const isToday = date.getTime() === today.getTime();
    
    if (isOverdue) return 'text-destructive';
    if (isToday) return 'text-priority-medium';
    return 'text-muted-foreground';
  });
  
  formattedDueDate = computed(() => {
    const dueDate = this.task().dueDate;
    if (!dueDate) return '';
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  hasLabels = computed(() => (this.task().labels?.length || 0) > 0);
  hasComments = computed(() => (this.task().comments?.length || 0) > 0);
  hasAttachments = computed(() => (this.task().attachments?.length || 0) > 0);
  hasSubtasks = computed(() => (this.task().subtasks?.length || 0) > 0);
  
  // Get first assignee for avatar display
  firstAssignee = computed(() => {
    const assignees = this.task().assignees;
    if (!assignees || assignees.length === 0) return null;
    return assignees[0];
  });
  
  // Get assignee initials
  assigneeInitials = computed(() => {
    const assignee = this.firstAssignee();
    if (!assignee) return '';
    return (assignee.firstName?.charAt(0) || '') + (assignee.lastName?.charAt(0) || '');
  });
  
  // Additional assignees count
  additionalAssigneesCount = computed(() => {
    const assignees = this.task().assignees;
    if (!assignees || assignees.length <= 1) return 0;
    return assignees.length - 1;
  });
  
  // Methods
  onCardClick(event: Event) {
    // Don't trigger if clicking on interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) {
      return;
    }
    this.cardClick.emit();
  }
  
  handleAddComment(event: Event) {
    event.stopPropagation();
    if (!this.commentText().trim()) return;
    
    const newComment = {
      id: 'comment-' + Date.now(),
      content: this.commentText().trim(),
      taskId: this.task().id,
      userId: '1', // Current user ID
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedComments = [...(this.task().comments || []), newComment];
    this.updateTask.emit({ comments: updatedComments });
    
    this.commentText.set('');
    this.commentOpen.set(false);
  }
  
  handleFileSelect(event: Event) {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    
    const newAttachments = Array.from(input.files).map(file => ({
      id: 'attach-' + Date.now() + Math.random(),
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      mimeType: file.type,
      taskId: this.task().id,
      fileSize: file.size,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    const updatedAttachments = [...(this.task().attachments || []), ...newAttachments];
    this.updateTask.emit({ attachments: updatedAttachments });
    
    // Reset input
    input.value = '';
  }
  
  handleAttachClick(event: Event) {
    event.stopPropagation();
    this.fileInput.nativeElement.click();
  }
  
  toggleCommentPopover(event: Event) {
    event.stopPropagation();
    this.commentOpen.set(!this.commentOpen());
  }
  
  onCommentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleAddComment(event);
    }
  }
  
  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}