import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Subtask } from '../models/task.model';

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
export class SubtasksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/subtasks`;

  /**
   * Create a new subtask
   */
  createSubtask(dto: CreateSubtaskDto): Observable<Subtask> {
    return this.http.post<Subtask>(this.apiUrl, dto);
  }

  /**
   * Get all subtasks for a task
   */
  getSubtasksByTask(taskId: string): Observable<Subtask[]> {
    return this.http.get<Subtask[]>(`${this.apiUrl}/task/${taskId}`);
  }

  /**
   * Update a subtask
   */
  updateSubtask(subtaskId: string, dto: UpdateSubtaskDto): Observable<Subtask> {
    return this.http.patch<Subtask>(`${this.apiUrl}/${subtaskId}`, dto);
  }

  /**
   * Toggle subtask completion
   */
  toggleComplete(subtaskId: string, isComplete: boolean): Observable<Subtask> {
    return this.http.patch<Subtask>(`${this.apiUrl}/${subtaskId}`, { isComplete });
  }

  /**
   * Delete a subtask
   */
  deleteSubtask(subtaskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${subtaskId}`);
  }
}
