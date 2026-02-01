import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { userResolver, notificationsResolver } from './core/resolvers';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  // ============================================
  // PUBLIC ROUTES - Auth Feature (Person 3)
  // ============================================
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },

  // ============================================
  // PROTECTED ROUTES WITH LAYOUT
  // ============================================
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    resolve: { notifications: notificationsResolver },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        data: { title: 'Dashboard' },
        resolve: { user: userResolver },
      },
      // ============================================
      // PROTECTED ROUTES - Projects Feature (Person 4)
      // ============================================
      {
        path: 'projects',
        loadChildren: () => import('./features/projects/projects.routes').then((m) => m.projectsRoutes),
      },

      // ============================================
      // PROTECTED ROUTES - Tasks Feature (Person 5)
      // ============================================
      {
        path: 'tasks',
        loadChildren: () => import('./features/tasks/tasks.routes').then((m) => m.tasksRoutes),
      },


      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile-form/profile-form.component').then(m => m.ProfileFormComponent),
        data: { title: 'Edit Profile' },
      },

      // ============================================
      // BOARD ROUTE
      // ============================================
      {
        path: 'board',
        loadComponent: () =>
          import('./features/board/board.component').then((m) => m.BoardComponent),
        data: { title: 'Board' },
      },

      // ============================================
      // SEARCH / WORKSPACE
      // ============================================
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/workspace.component').then((m) => m.WorkspaceComponent),
        data: { title: 'My Workspace' },
      },

      // ============================================
      // NOTIFICATIONS
      // ============================================
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications/notifications.component').then((m) => m.NotificationsComponent),
        data: { title: 'Notifications' },
        canActivate: [authGuard],
      },

      // ============================================
      // SETTINGS
      // ============================================
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
        data: { title: 'Settings' },
        canActivate: [authGuard],
      },

      // ============================================
      // ADMIN ROUTES
      // ============================================
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
    ],
  },

  // ============================================
  // FALLBACK ROUTES
  // ============================================
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
    data: { title: 'Page Not Found' },
  },
];