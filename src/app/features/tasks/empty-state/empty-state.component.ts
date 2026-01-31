import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inbox, Plus } from 'lucide-angular';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input() title = 'No tasks yet';
  @Input() description = 'Get started by creating your first task';
  @Input() actionLabel = 'Create Task';
  @Output() action = new EventEmitter<void>();

  onAction() {
    this.action.emit();
  }
}
