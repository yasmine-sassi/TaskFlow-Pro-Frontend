import { Injectable, signal, computed } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Represents a single breadcrumb item
 */
export interface Breadcrumb {
  label: string;
  path: string;
  isActive: boolean;
}

/**
 * NavigationService - Tracks routing history and generates breadcrumbs
 *
 * Features:
 * - Maintains navigation history
 * - Generates breadcrumbs from route hierarchy
 * - Provides back navigation
 * - Tracks current route metadata
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  // Signals for state management
  private breadcrumbsSignal = signal<Breadcrumb[]>([]);
  private navigationHistorySignal = signal<string[]>([]);
  private currentRouteSignal = signal<string>('');

  // Public computed signals
  breadcrumbs = this.breadcrumbsSignal.asReadonly();
  navigationHistory = this.navigationHistorySignal.asReadonly();
  currentRoute = this.currentRouteSignal.asReadonly();
  canGoBack = computed(() => this.navigationHistorySignal().length > 1);

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.initializeNavigation();
  }

  /**
   * Initialize navigation tracking
   */
  private initializeNavigation(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        this.currentRouteSignal.set(url);
        this.updateNavigationHistory(url);
        this.updateBreadcrumbs(url);
      });
  }

  /**
   * Update navigation history with new route
   */
  private updateNavigationHistory(url: string): void {
    const history = this.navigationHistorySignal();
    // Avoid duplicates - don't add if it's the same as last entry
    if (history[history.length - 1] !== url) {
      this.navigationHistorySignal.set([...history, url]);
    }
  }

  /**
   * Generate breadcrumbs from current route
   */
  private updateBreadcrumbs(url: string): void {
    const segments = url.split('/').filter((s) => s);
    const breadcrumbs: Breadcrumb[] = [
      {
        label: 'Home',
        path: '/dashboard',
        isActive: segments.length === 0,
      },
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isActive = index === segments.length - 1;

      // Format label (capitalize, replace hyphens with spaces)
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Skip ID segments like :projectId, :taskId
      if (!segment.match(/^[a-f0-9-]{36}$|^\d+$/)) {
        breadcrumbs.push({
          label,
          path: currentPath,
          isActive,
        });
      }
    });

    this.breadcrumbsSignal.set(breadcrumbs);
  }

  /**
   * Navigate back in history
   */
  goBack(): void {
    const history = this.navigationHistorySignal();
    if (history.length > 1) {
      const previousUrl = history[history.length - 2];
      this.navigationHistorySignal.set(history.slice(0, -1));
      this.router.navigateByUrl(previousUrl);
    }
  }

  /**
   * Navigate to specific breadcrumb
   */
  navigateToBreadcrumb(path: string): void {
    this.router.navigateByUrl(path);
  }

  /**
   * Clear navigation history
   */
  clearHistory(): void {
    this.navigationHistorySignal.set([]);
    this.breadcrumbsSignal.set([
      {
        label: 'Home',
        path: '/dashboard',
        isActive: true,
      },
    ]);
  }

  /**
   * Get page title from route data
   */
  getPageTitle(): string {
    let route = this.activatedRoute;
    let title = '';

    while (route) {
      const data = route.snapshot.data;
      if (data && data['title']) {
        title = data['title'];
      }
      route = route.firstChild as ActivatedRoute;
    }

    return title || 'TaskFlow Pro';
  }

  /**
   * Update browser title based on current route
   */
  updatePageTitle(): void {
    const title = this.getPageTitle();
    document.title = `${title} - TaskFlow Pro`;
  }
}
