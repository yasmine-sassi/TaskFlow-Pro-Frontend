import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Attachment } from '../models/task.model';
import { BaseService } from './base.service';

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
export class AttachmentsService extends BaseService {
  /**
   * Add attachment metadata to a task
   * Note: Actual file upload should be handled separately (e.g., to cloud storage)
   */
  createAttachment(dto: CreateAttachmentDto): Observable<Attachment> {
    return this.http.post<Attachment>(this.buildUrl('/attachments'), dto);
  }

  /**
   * Get all attachments for a task
   */
  getAttachmentsByTask(taskId: string): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(this.buildUrl(`/attachments/task/${taskId}`));
  }

  /**
   * Delete an attachment
   */
  deleteAttachment(attachmentId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/attachments/${attachmentId}`));
  }
}
