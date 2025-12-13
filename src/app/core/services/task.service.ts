import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';
import { environment } from '../../../environments/environment';

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  position?: number;
  projectId: string;
  assigneeIds?: string[];
  labelIds?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  position?: number;
}

export interface FilterTaskDto {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskListResponse {
  data: Task[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tasks`;

  /**
   * Create a new task
   */
  createTask(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, dto);
  }

  /**
   * Get all tasks for a project with optional filters
   */
  getTasksByProject(projectId: string, filter?: FilterTaskDto): Observable<TaskListResponse> {
    let params = new HttpParams();

    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.priority) params = params.set('priority', filter.priority);
      if (filter.assigneeId) params = params.set('assigneeId', filter.assigneeId);
      if (filter.search) params = params.set('search', filter.search);
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
    }

    return this.http.get<TaskListResponse>(`${this.apiUrl}/project/${projectId}`, { params });
  }

  /**
   * Get a single task by ID
   */
  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update a task
   */
  updateTask(id: string, dto: UpdateTaskDto): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Move task to a different status
   */
  moveTask(taskId: string, newStatus: TaskStatus): Observable<Task> {
    return this.updateTask(taskId, { status: newStatus });
  }

  /**
   * Assign a user to a task
   */
  assignUser(taskId: string, userId: string): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/${taskId}/assign`, { userId });
  }

  /**
   * Unassign a user from a task
   */
  unassignUser(taskId: string, userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${taskId}/assign/${userId}`);
  }
}
