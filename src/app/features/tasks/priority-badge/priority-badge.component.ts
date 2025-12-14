import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskPriority } from '../../../core/models/task.model';

@Component({
  selector: 'app-priority-badge',
  imports: [CommonModule],
  templateUrl: './priority-badge.component.html',
  styleUrl: './priority-badge.component.css',
})
export class PriorityBadgeComponent {
  priority = input.required<TaskPriority>();
  showLabel = input(true);
  
  private priorityConfig = {
    [TaskPriority.LOW]: {
      label: 'Low',
      class: 'bg-priority-low-bg text-priority-low',
      icon: 'down'
    },
    [TaskPriority.MEDIUM]: {
      label: 'Medium',
      class: 'bg-priority-medium-bg text-priority-medium',
      icon: 'right'
    },
    [TaskPriority.HIGH]: {
      label: 'High',
      class: 'bg-priority-high-bg text-priority-high',
      icon: 'up'
    },
    [TaskPriority.URGENT]: {
      label: 'Urgent',
      class: 'bg-red-100 text-red-800',
      icon: 'up'
    }
  };
  
  config = computed(() => this.priorityConfig[this.priority()]);
  badgeClasses = computed(() => this.config().class);
}
