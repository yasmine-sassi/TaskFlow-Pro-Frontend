import { Component, signal, inject, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';
import { NotificationsService } from '../../../core/services/notifications.service';
import { Notification, NotificationType } from '../../../core/models/notification.model';

type DateFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month';
type ReadFilter = 'all' | 'read' | 'unread';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  public notificationsService = inject(NotificationsService);
  private cdr = inject(ChangeDetectorRef);

  // UI state
  showFilters = signal(false);
  selectedNotification = signal<Notification | null>(null);

  // Filter signals
  dateFilter = signal<DateFilter>('all');
  readFilter = signal<ReadFilter>('all');

  // Service signals
  notifications = this.notificationsService.notificationsSignal;
  loading = this.notificationsService.loadingSignal;
  error = this.notificationsService.errorSignal;

  // Filtered notifications
  filteredNotifications = computed(() => {
    const notifications = this.notifications();
    const dateFilter = this.dateFilter();
    const readFilter = this.readFilter();
    const typeFilter = this.notificationsService.typeFilterSignal();

    return notifications.filter((notification) => {
      // Type filter
      if (typeFilter && notification.type !== typeFilter) {
        return false;
      }

      // Read filter
      if (readFilter === 'read' && !notification.isRead) {
        return false;
      }
      if (readFilter === 'unread' && notification.isRead) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const notificationDate = new Date(notification.createdAt);
        const now = new Date();

        switch (dateFilter) {
          case 'today':
            if (!isToday(notificationDate)) return false;
            break;
          case 'yesterday':
            if (!isYesterday(notificationDate)) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (notificationDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (notificationDate < monthAgo) return false;
            break;
        }
      }

      return true;
    });
  });

  // Computed properties for UI
  hasUnreadNotifications = computed(() => this.notificationsService.hasUnreadNotifications());
  totalCount = computed(() => this.notifications().length);
  filteredCount = computed(() => this.filteredNotifications().length);

  ngOnInit() {
    // Load latest notifications when the page is opened
    this.notificationsService.loadNotifications().subscribe({
      next: () => {
        // Notifications loaded
      },
      error: (error) => {
        console.error('Failed to load notifications on page open:', error);
      },
    });
  }

  toggleFilters() {
    this.showFilters.update((v) => !v);
  }

  setDateFilter(filter: DateFilter) {
    this.dateFilter.set(filter);
  }

  setReadFilter(filter: ReadFilter) {
    this.readFilter.set(filter);
  }

  setTypeFilter(type: string | null) {
    const notificationType = type ? (type as NotificationType) : null;
    this.notificationsService.setTypeFilter(notificationType);
  }

  clearFilters() {
    this.dateFilter.set('all');
    this.readFilter.set('all');
    this.notificationsService.clearFilters();
  }

  markAsRead(notificationId: string) {
    this.notificationsService.markAsReadWithSignal(notificationId).subscribe({
      next: () => {
        // Notification marked as read
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to mark notification as read:', error);
      },
    });
  }

  markAllAsRead() {
    this.notificationsService.markAllAsReadWithSignal().subscribe({
      next: () => {
        // All notifications marked as read
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to mark all notifications as read:', error);
      },
    });
  }

  deleteNotification(notificationId: string) {
    this.notificationsService.deleteNotificationWithSignal(notificationId).subscribe({
      next: () => {
        // Notification deleted
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to delete notification:', error);
      },
    });
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

  getFormattedDate(date: Date | string): string {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }

      if (isToday(dateObj)) {
        return 'Today';
      } else if (isYesterday(dateObj)) {
        return 'Yesterday';
      } else {
        return format(dateObj, 'MMM d, yyyy');
      }
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

  getDateFilterLabel(filter: DateFilter): string {
    const labels: Record<DateFilter, string> = {
      all: 'All time',
      today: 'Today',
      yesterday: 'Yesterday',
      week: 'Last 7 days',
      month: 'Last 30 days',
    };
    return labels[filter];
  }

  getReadFilterLabel(filter: ReadFilter): string {
    const labels: Record<ReadFilter, string> = {
      all: 'All',
      read: 'Read',
      unread: 'Unread',
    };
    return labels[filter];
  }
}
