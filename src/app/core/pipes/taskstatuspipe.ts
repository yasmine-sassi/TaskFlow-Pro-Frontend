import { Pipe, PipeTransform } from '@angular/core';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

@Pipe({
  name: 'taskStatusLabel',
  standalone: true,
})
export class TaskStatusLabelPipe implements PipeTransform {
  private statusMap: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: 'To Do',
    [TaskStatus.IN_PROGRESS]: 'In Progress',
    [TaskStatus.DONE]: 'Done',
    [TaskStatus.BLOCKED]: 'Blocked',
  };

  transform(value: TaskStatus): string {
    return this.statusMap[value] || value;
  }
}