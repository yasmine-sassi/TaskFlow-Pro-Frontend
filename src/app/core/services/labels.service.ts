import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Label } from '../models/task.model';

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
export class LabelsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/labels`;

  /**
   * Create a new label
   */
  createLabel(dto: CreateLabelDto): Observable<Label> {
    return this.http.post<Label>(this.apiUrl, dto);
  }

  /**
   * Get all labels
   */
  getAllLabels(): Observable<Label[]> {
    return this.http.get<Label[]>(this.apiUrl);
  }

  /**
   * Update a label
   */
  updateLabel(labelId: string, dto: UpdateLabelDto): Observable<Label> {
    return this.http.patch<Label>(`${this.apiUrl}/${labelId}`, dto);
  }

  /**
   * Delete a label
   */
  deleteLabel(labelId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${labelId}`);
  }

  /**
   * Attach a label to a task
   */
  attachLabelToTask(taskId: string, labelId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/attach/${taskId}/${labelId}`, {});
  }

  /**
   * Detach a label from a task
   */
  detachLabelFromTask(taskId: string, labelId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/attach/${taskId}/${labelId}`);
  }
}
