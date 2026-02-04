// header.component.ts - Add hasAvatar() helper and error handling
import { Component, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GlobalSearchComponent } from '../global-search/global-search.component';
import { NotificationsDropdownComponent } from '../notifications-dropdown/notifications-dropdown.component';
import { LucideIconComponent } from '../../shared/components/lucide-icon/lucide-icon.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    GlobalSearchComponent,
    NotificationsDropdownComponent,
    LucideIconComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentUser = this.authService.currentUserSignal;
  showUserDropdown = signal(false);
  private avatarError = signal(false);

  getInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';

    const name = `${user.firstName} ${user.lastName}`;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getUserName(): string {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  hasAvatar(): boolean {
    const user = this.currentUser();
    return !!(user?.avatar && !this.avatarError());
  }

  onAvatarError(event: Event): void {
    // Fallback to initials if image fails to load
    this.avatarError.set(true);
    (event.target as HTMLImageElement).style.display = 'none';
  }

  toggleUserDropdown() {
    this.showUserDropdown.update((v) => !v);
  }

  navigateToProfile() {
    this.router.navigate(['/settings'], { queryParams: { tab: 'profile' } });
    this.showUserDropdown.set(false);
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
    this.showUserDropdown.set(false);
  }

  logout() {
    this.authService.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.showUserDropdown.set(false);
  }
}
