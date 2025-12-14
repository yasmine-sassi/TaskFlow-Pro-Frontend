import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../core/services/navigation.service';

/**
 * BreadcrumbComponent - Displays navigation breadcrumbs
 *
 * Features:
 * - Shows current route hierarchy
 * - Clickable breadcrumbs for navigation
 * - Active state indication
 * - Responsive design with Tailwind CSS
 *
 * Usage:
 * <app-breadcrumb></app-breadcrumb>
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent {
  navigationService = inject(NavigationService);
  breadcrumbs = this.navigationService.breadcrumbs;

  /**
   * Handle breadcrumb click navigation
   */
  navigateTo(path: string): void {
    this.navigationService.navigateToBreadcrumb(path);
  }
}
