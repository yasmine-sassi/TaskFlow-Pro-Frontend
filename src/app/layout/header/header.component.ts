import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GlobalSearchComponent } from '../global-search/global-search.component';
import { NotificationsDropdownComponent } from '../notifications-dropdown/notifications-dropdown.component';
import { LucideIconComponent } from '../../shared/components/lucide-icon/lucide-icon.component';
import { BreadcrumbComponent } from "../breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    GlobalSearchComponent,
    NotificationsDropdownComponent,
    LucideIconComponent,
    BreadcrumbComponent
],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUserSignal;
  showUserDropdown = false;

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

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }

  navigateToProfile() {
    this.router.navigate(['/settings']);
    this.showUserDropdown = false;
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
    this.showUserDropdown = false;
  }

  logout() {
    this.authService.logout().subscribe();
    this.showUserDropdown = false;
  }
}
