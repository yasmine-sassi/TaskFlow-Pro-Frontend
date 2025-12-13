import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Activity } from '../models/activity.model';
import { BaseService } from './base.service';

interface ActivityListResponse {
  data: Activity[];
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
export class ActivityService extends BaseService {
  /**
   * Get activities for a specific project
   */
  getProjectActivities(
    projectId: string,
    page: number = 1,
    limit: number = 10
  ): Observable<ActivityListResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<ActivityListResponse>(this.buildUrl(`/activities/project/${projectId}`), {
      params,
    });
  }

  /**
   * Get activities for a specific task
   */
  getTaskActivities(
    taskId: string,
    page: number = 1,
    limit: number = 10
  ): Observable<ActivityListResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<ActivityListResponse>(this.buildUrl(`/activities/task/${taskId}`), {
      params,
    });
  }

  /**
   * Get recent activities (for a project or task)
   * Convenience method that returns just the data array
   */
  getRecentActivities(
    type: 'project' | 'task',
    id: string,
    limit: number = 10
  ): Observable<Activity[]> {
    const params = new HttpParams().set('page', '1').set('limit', limit.toString());

    const endpoint =
      type === 'project'
        ? this.buildUrl(`/activities/project/${id}`)
        : this.buildUrl(`/activities/task/${id}`);

    return this.http.get<Activity[]>(endpoint, { params });
  }
}
