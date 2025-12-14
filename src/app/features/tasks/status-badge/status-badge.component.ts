import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskStatus } from '../../../core/models/task.model';

@Component({
  selector: 'app-status-badge',
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',
})
export class StatusBadgeComponent {
  status = input.required<TaskStatus>();
  
  private statusConfig: Record<TaskStatus, { label: string; class: string }> = {
    [TaskStatus.TODO]: {
      label: 'To Do',
      class: 'bg-status-todo-bg text-status-todo'
    },
    [TaskStatus.IN_PROGRESS]: {
      label: 'In Progress',
      class: 'bg-status-in-progress-bg text-status-in-progress'
    },
    [TaskStatus.IN_REVIEW]: {
      label: 'In Review',
      class: 'bg-yellow-100 text-yellow-800'
    },
    [TaskStatus.DONE]: {
      label: 'Done',
      class: 'bg-status-done-bg text-status-done'
    },
    [TaskStatus.DOING]: {
      label: '',
      class: ''
    }
  };
  
  config = computed(() => this.statusConfig[this.status()]);
  badgeClasses = computed(() => this.config().class);
}
