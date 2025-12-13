import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subtask } from '../models/task.model';
import { BaseService } from './base.service';

export interface CreateSubtaskDto {
  taskId: string;
  title: string;
  position?: number;
}

export interface UpdateSubtaskDto {
  title?: string;
  isComplete?: boolean;
  position?: number;
}

@Injectable({
  providedIn: 'root',
})
export class SubtasksService extends BaseService {
  /**
   * Create a new subtask
   */
  createSubtask(dto: CreateSubtaskDto): Observable<Subtask> {
    return this.http.post<Subtask>(this.buildUrl('/subtasks'), dto);
  }

  /**
   * Get all subtasks for a task
   */
  getSubtasksByTask(taskId: string): Observable<Subtask[]> {
    return this.http.get<Subtask[]>(this.buildUrl(`/subtasks/task/${taskId}`));
  }

  /**
   * Update a subtask
   */
  updateSubtask(subtaskId: string, dto: UpdateSubtaskDto): Observable<Subtask> {
    return this.http.patch<Subtask>(this.buildUrl(`/subtasks/${subtaskId}`), dto);
  }

  /**
   * Toggle subtask completion
   */
  toggleComplete(subtaskId: string, isComplete: boolean): Observable<Subtask> {
    return this.http.patch<Subtask>(this.buildUrl(`/subtasks/${subtaskId}`), { isComplete });
  }

  /**
   * Delete a subtask
   */
  deleteSubtask(subtaskId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/subtasks/${subtaskId}`));
  }
}
