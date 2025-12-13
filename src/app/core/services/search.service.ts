import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, Comment } from '../models/task.model';

export interface SearchTasksParams {
  q?: string; // Search query
  projectId?: string;
  status?: string;
  priority?: string;
  assignedToMe?: boolean;
}

export interface SearchCommentsParams {
  q?: string; // Search query
  projectId?: string;
  taskId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/search`;

  /**
   * Search tasks across all accessible projects
   */
  searchTasks(params: SearchTasksParams): Observable<Task[]> {
    let httpParams = new HttpParams();

    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.projectId) httpParams = httpParams.set('projectId', params.projectId);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.priority) httpParams = httpParams.set('priority', params.priority);
    if (params.assignedToMe) httpParams = httpParams.set('assignedToMe', 'true');

    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, { params: httpParams });
  }

  /**
   * Search comments across all accessible projects
   */
  searchComments(params: SearchCommentsParams): Observable<Comment[]> {
    let httpParams = new HttpParams();

    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.projectId) httpParams = httpParams.set('projectId', params.projectId);
    if (params.taskId) httpParams = httpParams.set('taskId', params.taskId);

    return this.http.get<Comment[]>(`${this.apiUrl}/comments`, { params: httpParams });
  }
}
