import { Injectable, signal, computed, effect, inject, DestroyRef } from '@angular/core';
import { Observable, interval, startWith, switchMap, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type Notification, NotificationType } from '../models/notification.model';
import { BaseService } from './base.service';
import { LoggerService } from './logger.service';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface UnreadCountResponse {
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService extends BaseService {
  private logger = inject(LoggerService);
  private webSocketService = inject(WebSocketService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  // Signals for state management
  notificationsSignal = signal<Notification[]>([]);
  unreadCountSignal = signal<number>(0);
  loadingSignal = signal<boolean>(false);
  errorSignal = signal<string | null>(null);

  // Filter signals
  typeFilterSignal = signal<NotificationType | null>(null);
  showUnreadOnlySignal = signal<boolean>(false);

  // Computed properties for derived states
  allNotifications = computed(() => this.notificationsSignal());
  unreadNotifications = computed(() => this.notificationsSignal().filter((n) => !n.isRead));
  readNotifications = computed(() => this.notificationsSignal().filter((n) => n.isRead));

  filteredNotifications = computed(() => {
    const notifications = this.notificationsSignal();
    const typeFilter = this.typeFilterSignal();
    const showUnreadOnly = this.showUnreadOnlySignal();

    return notifications.filter((notification) => {
      // Type filter
      if (typeFilter && notification.type !== typeFilter) {
        return false;
      }

      // Unread filter
      if (showUnreadOnly && notification.isRead) {
        return false;
      }

      return true;
    });
  });

  // Group notifications by type
  notificationsByType = computed(() => {
    const notifications = this.notificationsSignal();
    return {
      [NotificationType.TASK_ASSIGNED]: notifications.filter(
        (n) => n.type === NotificationType.TASK_ASSIGNED,
      ),
      [NotificationType.TASK_UPDATED]: notifications.filter(
        (n) => n.type === NotificationType.TASK_UPDATED,
      ),
      [NotificationType.TASK_COMPLETED]: notifications.filter(
        (n) => n.type === NotificationType.TASK_COMPLETED,
      ),
      [NotificationType.COMMENT_ADDED]: notifications.filter(
        (n) => n.type === NotificationType.COMMENT_ADDED,
      ),
      [NotificationType.PROJECT_INVITE]: notifications.filter(
        (n) => n.type === NotificationType.PROJECT_INVITE,
      ),
      [NotificationType.MENTION]: notifications.filter((n) => n.type === NotificationType.MENTION),
    };
  });

  // Computed for UI indicators
  hasUnreadNotifications = computed(() => this.unreadCountSignal() > 0);
  totalNotificationsCount = computed(() => this.notificationsSignal().length);

  constructor() {
    super();
    // Effects for side effects
    effect(() => {
      const notifications = this.notificationsSignal();
      this.logger.info(`Notifications updated: ${notifications.length} notifications loaded`);
    });

    effect(() => {
      const unreadCount = this.unreadCountSignal();
      this.logger.info(`Unread notifications: ${unreadCount}`);
    });

    effect(() => {
      const error = this.errorSignal();
      if (error) {
        this.logger.error(`Notifications error: ${error}`);
      }
    });

    // Set up WebSocket listeners
    this.setupWebSocketListeners();

    // Reconnect WebSocket when user logs in
    effect(() => {
      const user = this.authService.currentUserSignal();
      if (user) {
        this.logger.info('User logged in, reconnecting WebSocket');
        this.webSocketService.reconnect();
      } else {
        this.logger.info('User logged out, disconnecting WebSocket');
        this.webSocketService.disconnect();
      }
    });

    // Auto-refresh unread count every 30 seconds (fallback for WebSocket)
    const polling$ = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.getUnreadCount()),
      takeUntilDestroyed(this.destroyRef),
    );

    polling$.subscribe({
      next: (response) => {
        // Only update if WebSocket is not connected
        if (!this.webSocketService.isConnected()) {
          this.unreadCountSignal.set(response.count);
        }
      },
      error: (error) => {
        this.logger.error('Failed to poll unread count:', error);
      },
    });
  }

  private setupWebSocketListeners() {
    // Listen for new notifications
    this.webSocketService
      .onNewNotification()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notification) => {
          this.logger.info('Adding new notification from WebSocket:', notification);
          // Parse dates from WebSocket (they come as strings)
          const parsedNotification: Notification = {
            ...notification,
            type: notification.type as NotificationType,
            createdAt: new Date(notification.createdAt),
            updatedAt: new Date(notification.updatedAt),
          };
          this.logger.info('Parsed notification:', parsedNotification);
          const currentNotifications = this.notificationsSignal();
          this.logger.info('Current notifications count:', currentNotifications.length);
          this.notificationsSignal.update((notifications) => {
            const newNotifications = [parsedNotification, ...notifications];
            this.logger.info('New notifications count after update:', newNotifications.length);
            return newNotifications;
          });
          this.logger.info('Notification added to signal successfully');
        },
        error: (error) => {
          this.logger.warn(
            'WebSocket newNotification error (expected if server not running):',
            error,
          );
        },
      });

    // Listen for unread count updates
    this.webSocketService
      .onUnreadCountUpdate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.logger.info('Updating unread count from WebSocket:', data.count);
          this.unreadCountSignal.set(data.count);
        },
        error: (error) => {
          this.logger.warn('WebSocket unreadCount error (expected if server not running):', error);
        },
      });

    // Listen for notification read events
    this.webSocketService
      .onNotificationRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.logger.info('Marking notification as read from WebSocket:', data.notificationId);
          this.notificationsSignal.update((notifications) =>
            notifications.map((n) => (n.id === data.notificationId ? { ...n, isRead: true } : n)),
          );
        },
        error: (error) => {
          this.logger.warn(
            'WebSocket notificationRead error (expected if server not running):',
            error,
          );
        },
      });
  }
  /**
   * Get all notifications for current user
   * @param unreadOnly - Optional flag to get only unread notifications
   */
  getNotifications(unreadOnly?: boolean): Observable<Notification[]> {
    if (unreadOnly) {
      return this.http
        .get<ApiResponse<Notification[]>>(this.buildUrl('/notifications'), {
          params: { unreadOnly: 'true' },
        })
        .pipe(map((response) => response.data));
    }
    return this.http
      .get<ApiResponse<Notification[]>>(this.buildUrl('/notifications'))
      .pipe(map((response) => response.data));
  }

  /**
   * Get count of unread notifications
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http
      .get<ApiResponse<UnreadCountResponse>>(this.buildUrl('/notifications/unread-count'))
      .pipe(map((response) => response.data));
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): Observable<Notification> {
    return this.http
      .patch<ApiResponse<Notification>>(this.buildUrl(`/notifications/${notificationId}/read`), {})
      .pipe(map((response) => response.data));
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<void> {
    return this.http
      .patch<ApiResponse<{ updated: boolean }>>(this.buildUrl('/notifications/read-all'), {})
      .pipe(map(() => void 0));
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<{ deleted: boolean }>>(this.buildUrl(`/notifications/${notificationId}`))
      .pipe(map(() => void 0));
  }

  // ============================================
  // Signal-Based State Management Methods
  // ============================================

  /**
   * Load all notifications and update signals
   */
  loadNotifications(): Observable<Notification[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.get<ApiResponse<Notification[]>>(this.buildUrl('/notifications')).pipe(
      map((response) =>
        response.data.map((notification) => ({
          ...notification,
          type: notification.type as NotificationType,
          createdAt: new Date(notification.createdAt),
          updatedAt: new Date(notification.updatedAt),
        })),
      ),
      tap((notifications) => {
        this.notificationsSignal.set(notifications);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to load notifications');
        this.loadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Load unread count and update signal
   */
  loadUnreadCount(): Observable<UnreadCountResponse> {
    return this.http
      .get<ApiResponse<UnreadCountResponse>>(this.buildUrl('/notifications/unread-count'))
      .pipe(
        map((response) => response.data),
        tap((response) => {
          const count = response?.count ?? 0;
          this.logger.info('Setting unread count to:', count);
          this.unreadCountSignal.set(count);
        }),
        catchError((error) => {
          this.logger.error('Failed to load unread count:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Mark notification as read and update signals
   */
  markAsReadWithSignal(notificationId: string): Observable<Notification> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.markAsRead(notificationId).pipe(
      tap((updatedNotification) => {
        const parsedNotification: Notification = {
          ...updatedNotification,
          type: updatedNotification.type as NotificationType,
          createdAt: new Date(updatedNotification.createdAt),
          updatedAt: new Date(updatedNotification.updatedAt),
        };
        this.notificationsSignal.update((notifications) =>
          notifications.map((n) => (n.id === notificationId ? parsedNotification : n)),
        );
        // Update unread count
        const currentCount = this.unreadCountSignal();
        const newCount = Math.max(0, currentCount - 1);
        this.unreadCountSignal.set(newCount);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to mark notification as read');
        this.loadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Mark all notifications as read and update signals
   */
  markAllAsReadWithSignal(): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.markAllAsRead().pipe(
      tap(() => {
        this.notificationsSignal.update((notifications) =>
          notifications.map((n) => ({ ...n, isRead: true })),
        );
        this.unreadCountSignal.set(0);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to mark all notifications as read');
        this.loadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Delete notification and update signals
   */
  deleteNotificationWithSignal(notificationId: string): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.deleteNotification(notificationId).pipe(
      tap(() => {
        const notification = this.notificationsSignal().find((n) => n.id === notificationId);
        this.notificationsSignal.update((notifications) =>
          notifications.filter((n) => n.id !== notificationId),
        );
        // Update unread count if deleted notification was unread
        if (notification && !notification.isRead) {
          this.unreadCountSignal.update((count) => Math.max(0, count - 1));
        }
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to delete notification');
        this.loadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  // ============================================
  // Filter Management Methods
  // ============================================

  /**
   * Set type filter
   */
  setTypeFilter(type: NotificationType | null): void {
    this.typeFilterSignal.set(type);
  }

  /**
   * Set unread only filter
   */
  setShowUnreadOnly(showUnreadOnly: boolean): void {
    this.showUnreadOnlySignal.set(showUnreadOnly);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.typeFilterSignal.set(null);
    this.showUnreadOnlySignal.set(false);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Reset all signals
   */
  resetState(): void {
    this.notificationsSignal.set([]);
    this.unreadCountSignal.set(0);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.clearFilters();
  }

  /**
   * Play notification sound (placeholder for future implementation)
   */
  playNotificationSound(): void {
    // TODO: Implement sound notification
    this.logger.info('Notification sound would play here');
  }
}
