import { Pipe, PipeTransform } from '@angular/core';

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Pipe({
  name: 'priorityColor',
  standalone: true,
})
export class PriorityColorPipe implements PipeTransform {
  private colorMap: Record<Priority, string> = {
    [Priority.LOW]: 'text-blue-500',
    [Priority.MEDIUM]: 'text-yellow-500',
    [Priority.HIGH]: 'text-orange-500',
    [Priority.CRITICAL]: 'text-red-500',
  };

  transform(value: Priority): string {
    return this.colorMap[value] || 'text-gray-500';
  }
}