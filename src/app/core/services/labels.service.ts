import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Label } from '../models/task.model';
import { BaseService } from './base.service';

export interface CreateLabelDto {
  name: string;
  color: string;
}

export interface UpdateLabelDto {
  name?: string;
  color?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LabelsService extends BaseService {
  /**
   * Create a new label
   */
  createLabel(dto: CreateLabelDto): Observable<Label> {
    return this.http.post<Label>(this.buildUrl('/labels'), dto);
  }

  /**
   * Get all labels
   */
  getAllLabels(): Observable<Label[]> {
    return this.http.get<Label[]>(this.buildUrl('/labels'));
  }

  /**
   * Update a label
   */
  updateLabel(labelId: string, dto: UpdateLabelDto): Observable<Label> {
    return this.http.patch<Label>(this.buildUrl(`/labels/${labelId}`), dto);
  }

  /**
   * Delete a label
   */
  deleteLabel(labelId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/labels/${labelId}`));
  }

  /**
   * Attach a label to a task
   */
  attachLabelToTask(taskId: string, labelId: string): Observable<any> {
    return this.http.post(this.buildUrl(`/labels/attach/${taskId}/${labelId}`), {});
  }

  /**
   * Detach a label from a task
   */
  detachLabelFromTask(taskId: string, labelId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/labels/attach/${taskId}/${labelId}`));
  }
}
