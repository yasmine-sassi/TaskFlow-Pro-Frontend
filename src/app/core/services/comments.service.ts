import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comment } from '../models/task.model';

export interface CreateCommentDto {
  taskId: string;
  content: string;
}

export interface UpdateCommentDto {
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/comments`;

  /**
   * Create a new comment on a task
   */
  createComment(dto: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, dto);
  }

  /**
   * Get all comments for a specific task
   */
  getCommentsByTask(taskId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/task/${taskId}`);
  }

  /**
   * Update a comment (author only)
   */
  updateComment(commentId: string, dto: UpdateCommentDto): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/${commentId}`, dto);
  }

  /**
   * Delete a comment (author only)
   */
  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${commentId}`);
  }
}
