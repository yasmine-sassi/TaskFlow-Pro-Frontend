import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Label } from '../../../core/models/task.model';

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', 
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16'
];

@Component({
  selector: 'app-label-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './label-select.component.html',
  styleUrl: './label-select.component.css',
})
export class LabelSelectComponent {
  selectedLabels = input.required<Label[]>();
  availableLabels = input.required<Label[]>();
  
  labelsChange = output<Label[]>();
  createLabel = output<{ name: string; color: string }>();

  isOpen = signal(false);
  isCreating = signal(false);
  newLabelName = signal('');
  newLabelColor = signal(PRESET_COLORS[0]);
  
  presetColors = PRESET_COLORS;

  isSelected(labelId: string): boolean {
    return this.selectedLabels().some(l => l.id === labelId);
  }

  toggleLabel(label: Label) {
    const exists = this.selectedLabels().find(l => l.id === label.id);
    if (exists) {
      this.labelsChange.emit(this.selectedLabels().filter(l => l.id !== label.id));
    } else {
      this.labelsChange.emit([...this.selectedLabels(), label]);
    }
  }

  removeLabel(labelId: string) {
    this.labelsChange.emit(this.selectedLabels().filter(l => l.id !== labelId));
  }

  handleCreateLabel() {
    if (this.newLabelName().trim()) {
      this.createLabel.emit({
        name: this.newLabelName().trim(),
        color: this.newLabelColor()
      });
      this.newLabelName.set('');
      this.newLabelColor.set(PRESET_COLORS[0]);
      this.isCreating.set(false);
    }
  }
}