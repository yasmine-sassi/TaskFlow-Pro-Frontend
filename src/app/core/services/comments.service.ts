import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Comment } from '../models/task.model';
import { BaseService } from './base.service';

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
export class CommentsService extends BaseService {
  /**
   * Create a new comment on a task
   */
  createComment(dto: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(this.buildUrl('/comments'), dto);
  }

  /**
   * Get all comments for a specific task
   */
  getCommentsByTask(taskId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(this.buildUrl(`/comments/task/${taskId}`));
  }

  /**
   * Update a comment (author only)
   */
  updateComment(commentId: string, dto: UpdateCommentDto): Observable<Comment> {
    return this.http.patch<Comment>(this.buildUrl(`/comments/${commentId}`), dto);
  }

  /**
   * Delete a comment (author only)
   */
  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/comments/${commentId}`));
  }
}
