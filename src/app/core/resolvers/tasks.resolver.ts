import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { TasksService, ApiResponse } from '../services/task.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Task } from '../models/task.model';

/**
 * TasksResolver - Pre-loads tasks assigned to authenticated user before route activation
 * Used for: /tasks (my tasks page)
 *
 * Benefits:
 * - Tasks list is ready when component initializes
 * - Prevents empty state on first load
 * - Can display data immediately
 */
export const tasksResolver: ResolveFn<Task[] | null> = () => {
  const tasksService = inject(TasksService);

  return tasksService.getMyTasks().pipe(
    catchError((error) => {
      console.error('Failed to load tasks:', error);
      return of(null);
    })
  );
};
