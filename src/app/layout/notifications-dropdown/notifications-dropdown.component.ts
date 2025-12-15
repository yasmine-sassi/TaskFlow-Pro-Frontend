import { Component, signal, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatDistanceToNow } from 'date-fns';
import { LucideIconComponent } from '../../shared/components/lucide-icon/lucide-icon.component';
import { NotificationsService } from '../../core/services/notifications.service';
import { Notification, NotificationType } from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications-dropdown',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './notifications-dropdown.component.html',
  styleUrls: ['./notifications-dropdown.component.css'],
})
export class NotificationsDropdownComponent implements OnInit {
  public notificationsService = inject(NotificationsService);

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
    // Load notifications on component init
    effect(() => {
      if (this.showDropdown()) {
        this.loadNotifications();
      }
    });
  }

  ngOnInit() {
    // Load initial unread count
    this.notificationsService.loadUnreadCount().subscribe();
  }

  toggleDropdown() {
    this.showDropdown.update((v) => !v);
  }

  loadNotifications() {
    this.notificationsService.loadNotifications().subscribe({
      next: () => {
        // Notifications loaded successfully
      },
      error: (error) => {
        console.error('Failed to load notifications:', error);
      }
    });
  }

  markAsRead(notificationId: string) {
    this.notificationsService.markAsReadWithSignal(notificationId).subscribe({
      next: () => {
        // Notification marked as read
        this.playNotificationSound();
      },
      error: (error) => {
        console.error('Failed to mark notification as read:', error);
      }
    });
  }

  markAllAsRead() {
    this.notificationsService.markAllAsReadWithSignal().subscribe({
      next: () => {
        // All notifications marked as read
        this.playNotificationSound();
      },
      error: (error) => {
        console.error('Failed to mark all notifications as read:', error);
      }
    });
  }

  deleteNotification(notificationId: string) {
    this.notificationsService.deleteNotificationWithSignal(notificationId).subscribe({
      next: () => {
        // Notification deleted
      },
      error: (error) => {
        console.error('Failed to delete notification:', error);
      }
    });
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
      console.error('Error parsing date:', date, error);
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

  private playNotificationSound(): void {
    this.notificationsService.playNotificationSound();
  }
}
