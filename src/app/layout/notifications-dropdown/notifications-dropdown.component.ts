import {
  Component,
  signal,
  inject,
  computed,
  effect,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { RouterLink } from '@angular/router';
import { formatDistanceToNow } from 'date-fns';
import { interval, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideIconComponent } from '../../shared/components/lucide-icon/lucide-icon.component';
import { NotificationsService } from '../../core/services/notifications.service';
import { Notification, NotificationType } from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconComponent, ScrollingModule],
  templateUrl: './notifications-dropdown.component.html',
  styleUrls: ['./notifications-dropdown.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsDropdownComponent implements OnInit {
  public notificationsService = inject(NotificationsService);
  private destroyRef = inject(DestroyRef);

  // UI state
  showDropdown = signal(false);
  showFilters = signal(false);

  // Service signals
  notifications = this.notificationsService.notificationsSignal;
  filteredNotifications = this.notificationsService.filteredNotifications;
  unreadCount = this.notificationsService.unreadCountSignal;
  loading = this.notificationsService.loadingSignal;
  error = this.notificationsService.errorSignal;
  hasUnreadNotifications = this.notificationsService.hasUnreadNotifications;

  constructor() {
    // No need to load data here - it's handled by the resolver
    // Just set up effects for UI interactions
  }

  ngOnInit() {
    // Data is already loaded by resolver, just start polling for updates
    this.startPolling();
  }

  private startPolling() {
    // Poll for unread count updates every 30 seconds
    interval(30000)
      .pipe(
        switchMap(() => this.notificationsService.loadUnreadCount()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          // Unread count updated
        },
        error: () => {
          // Silently fail polling
        },
      });
  }

  toggleDropdown() {
    this.showDropdown.update((v) => {
      const newValue = !v;
      // When opening the dropdown, load latest notifications
      if (newValue) {
        void this.loadNotificationsOnce();
      }
      return newValue;
    });
  }

  async markAsRead(notificationId: string) {
    const notification = this.notifications().find((n) => n.id === notificationId);

    try {
      await firstValueFrom(this.notificationsService.markAsReadWithSignal(notificationId));
      this.playNotificationSound();
    } catch {
      // No-op
    }
  }

  async markAllAsRead() {
    try {
      await firstValueFrom(this.notificationsService.markAllAsReadWithSignal());
      this.playNotificationSound();
    } catch {
      // No-op
    }
  }

  async deleteNotification(notificationId: string) {
    try {
      await firstValueFrom(this.notificationsService.deleteNotificationWithSignal(notificationId));
    } catch {
      // No-op
    }
  }

  private async loadNotificationsOnce(): Promise<void> {
    try {
      await firstValueFrom(this.notificationsService.loadNotifications());
    } catch {
      // No-op
    }
  }

  setTypeFilter(type: string | null) {
    const notificationType = type ? (type as NotificationType) : null;
    this.notificationsService.setTypeFilter(notificationType);
  }

  toggleShowUnreadOnly() {
    this.notificationsService.setShowUnreadOnly(!this.notificationsService.showUnreadOnlySignal());
  }

  clearFilters() {
    this.notificationsService.clearFilters();
  }

  getTimeAgo(date: Date | string): string {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  }

  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      [NotificationType.TASK_ASSIGNED]: 'CheckSquare',
      [NotificationType.TASK_UPDATED]: 'Edit',
      [NotificationType.TASK_COMPLETED]: 'CheckCircle',
      [NotificationType.COMMENT_ADDED]: 'MessageSquare',
      [NotificationType.PROJECT_INVITE]: 'UserPlus',
      [NotificationType.MENTION]: 'AtSign',
    };
    return icons[type] || 'Bell';
  }

  getNotificationColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      [NotificationType.TASK_ASSIGNED]: 'bg-blue-500/10 text-blue-600',
      [NotificationType.TASK_UPDATED]: 'bg-orange-500/10 text-orange-600',
      [NotificationType.TASK_COMPLETED]: 'bg-green-500/10 text-green-600',
      [NotificationType.COMMENT_ADDED]: 'bg-purple-500/10 text-purple-600',
      [NotificationType.PROJECT_INVITE]: 'bg-indigo-500/10 text-indigo-600',
      [NotificationType.MENTION]: 'bg-pink-500/10 text-pink-600',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-600';
  }

  trackByNotificationId = (_index: number, notification: Notification) => notification.id;

  // Swipe gesture methods
  private swipeStartX: number = 0;
  private swipeElement: HTMLElement | null = null;
  private isSwiping: boolean = false;

  onTouchStart(event: TouchEvent, notificationId: string): void {
    if (!notificationId) return;

    const touch = event.touches[0];
    this.swipeStartX = touch.clientX;
    this.swipeElement = event.target as HTMLElement;
    this.isSwiping = false;
  }

  onTouchMove(event: TouchEvent, notificationId: string): void {
    if (!notificationId || !this.swipeElement) return;

    event.preventDefault();
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.swipeStartX;

    // Only consider it a swipe if moved more than 10px
    if (Math.abs(deltaX) > 10) {
      this.isSwiping = true;
    }

    // Apply transform for visual feedback
    const maxSwipe = 60;
    const offset = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    this.swipeElement.style.transform = `translateX(${offset}px)`;
  }

  onTouchEnd(event: TouchEvent, notificationId: string): void {
    if (!notificationId || !this.swipeElement) return;

    const transform = this.swipeElement.style.transform;
    const offset = transform
      ? parseFloat(transform.replace('translateX(', '').replace('px)', ''))
      : 0;

    // Reset transform
    this.swipeElement.style.transform = '';

    const threshold = 40; // Minimum distance to trigger action

    if (this.isSwiping && Math.abs(offset) > threshold) {
      event.preventDefault(); // Prevent click event

      if (offset > 0) {
        // Swipe right - mark as read
        this.markAsRead(notificationId);
      } else {
        // Swipe left - delete
        this.deleteNotification(notificationId);
      }
    }

    // Reset swipe state
    this.swipeStartX = 0;
    this.swipeElement = null;
    this.isSwiping = false;
  }

  private playNotificationSound(): void {
    this.notificationsService.playNotificationSound();
  }
}
