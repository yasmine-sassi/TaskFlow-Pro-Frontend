import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from '../models/notification.model';
import { BaseService } from './base.service';

export interface UnreadCountResponse {
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService extends BaseService {
  /**
   * Get all notifications for current user
   * @param unreadOnly - Optional flag to get only unread notifications
   */
  getNotifications(unreadOnly?: boolean): Observable<Notification[]> {
    if (unreadOnly) {
      return this.http.get<Notification[]>(this.buildUrl('/notifications'), {
        params: { unreadOnly: 'true' },
      });
    }
    return this.http.get<Notification[]>(this.buildUrl('/notifications'));
  }

  /**
   * Get count of unread notifications
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(this.buildUrl('/notifications/unread-count'));
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.patch<Notification>(
      this.buildUrl(`/notifications/${notificationId}/read`),
      {}
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(this.buildUrl('/notifications/read-all'), {});
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/notifications/${notificationId}`));
  }
}
