import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Attachment } from '../models/task.model';

export interface CreateAttachmentDto {
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

@Injectable({
  providedIn: 'root',
})
export class AttachmentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/attachments`;

  /**
   * Add attachment metadata to a task
   * Note: Actual file upload should be handled separately (e.g., to cloud storage)
   */
  createAttachment(dto: CreateAttachmentDto): Observable<Attachment> {
    return this.http.post<Attachment>(this.apiUrl, dto);
  }

  /**
   * Get all attachments for a task
   */
  getAttachmentsByTask(taskId: string): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.apiUrl}/task/${taskId}`);
  }

  /**
   * Delete an attachment
   */
  deleteAttachment(attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${attachmentId}`);
  }
}
