import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, Comment } from '../models/task.model';
import { BaseService } from './base.service';

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
export class SearchService extends BaseService {
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

    return this.http.get<Task[]>(this.buildUrl('/search/tasks'), { params: httpParams });
  }

  /**
   * Search comments across all accessible projects
   */
  searchComments(params: SearchCommentsParams): Observable<Comment[]> {
    let httpParams = new HttpParams();

    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.projectId) httpParams = httpParams.set('projectId', params.projectId);
    if (params.taskId) httpParams = httpParams.set('taskId', params.taskId);

    return this.http.get<Comment[]>(this.buildUrl('/search/comments'), { params: httpParams });
  }
}
