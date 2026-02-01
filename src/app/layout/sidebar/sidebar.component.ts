import {
  Component,
  signal,
  Output,
  EventEmitter,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';
import { LucideIconComponent } from '../../shared/components/lucide-icon/lucide-icon.component';
import { NotificationsService } from '../../core/services/notifications.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);

  collapsed = signal(false);
  @Output() collapsedChange = new EventEmitter<boolean>();

  currentUser = this.authService.currentUserSignal;
  UserRole = UserRole;

  private baseNavItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/projects', label: 'Projects', icon: 'FolderOpen' },
    { path: '/tasks', label: 'Tasks', icon: 'ListTodo' },
    { path: '/board', label: 'Board', icon: 'Kanban' },
  ];

  navItems = computed(() => {
    const role = this.currentUser()?.role;
    if (role === UserRole.ADMIN) {
      return this.baseNavItems.filter(
        (item) => item.path !== '/dashboard' && item.path !== '/tasks',
      );
    }
    return this.baseNavItems;
  });

  get bottomNavItems() {
    return [
      { path: '/search', label: 'My Workspace', icon: 'folder-open' },
      {
        path: '/notifications',
        label: 'Notifications',
        icon: 'Bell',
        badge: this.notificationsService.unreadCountSignal(),
      },
      { path: '/settings', label: 'Settings', icon: 'Settings' },
    ];
  }

  toggleCollapse() {
    this.collapsed.update((v) => !v);
    this.collapsedChange.emit(this.collapsed());
  }

  getInitials(email: string): string {
    return email?.charAt(0).toUpperCase() || 'U';
  }
}
