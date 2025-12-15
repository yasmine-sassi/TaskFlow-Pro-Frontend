import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Notification } from '../models/notification.model';
import { NotificationsService } from '../services/notifications.service';

/**
 * NotificationsResolver - Pre-loads notifications data before route activation
 * Used for: Routes that need notifications context (like dashboard, main app)
 *
 * Benefits:
 * - Notifications data is available when components initialize
 * - Prevents empty state on first load
 * - Badge shows correct count immediately
 * - Can display notifications in dropdown without loading delay
 */
export const notificationsResolver: ResolveFn<{ notifications: Notification[]; unreadCount: number } | null> = () => {
  const notificationsService = inject(NotificationsService);

  return forkJoin({
    notifications: notificationsService.loadNotifications(),
    unreadCount: notificationsService.loadUnreadCount().pipe(
      map((response) => response.count), // Extract count from response
      tap((count) => {
        notificationsService.unreadCountSignal.set(count);
      })
    )
  }).pipe(
    tap((result) => {
      // Data is already set in signals by the service methods
      console.log('Notifications resolver: Data preloaded successfully');
    }),
    catchError((error) => {
      console.error('Notifications resolver: Failed to preload data:', error);
      // Return null but don't fail navigation - components can handle loading states
      return of(null);
    })
  );
};