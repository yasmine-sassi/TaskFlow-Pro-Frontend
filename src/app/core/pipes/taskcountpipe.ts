import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'taskCount',
  standalone: true,
})
export class TaskCountPipe implements PipeTransform {
  transform(count: number): string {
    if (!count && count !== 0) return '';
    return `${count} task${count !== 1 ? 's' : ''}`;
  }
}