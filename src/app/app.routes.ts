import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { projectMemberGuard } from './core/guards/project-member.guard';
import { projectResolver, projectsResolver, tasksResolver, userResolver, notificationsResolver } from './core/resolvers';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  // ============================================
  // PUBLIC ROUTES - Auth Feature (Person 3)
  // ============================================
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then((m) => m.Login),
        data: { title: 'Login' },
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
        data: { title: 'Register' },
      },
    ],
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
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/projects/projects/projects.component').then(
                (m) => m.ProjectsComponent
              ),
            data: { title: 'Projects' },
            resolve: { projects: projectsResolver },
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/projects/project-form/project-form.component').then(
                (m) => m.ProjectFormComponent
              ),
            data: { title: 'Create Project' },
          },
          {
            path: ':projectId',
            canActivate: [projectMemberGuard],
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./features/board/board.component').then((m) => m.BoardComponent),
                data: { title: 'Project Board' },
                resolve: { project: projectResolver },
              },
            ],
          },
        ],
      },

      // ============================================
      // PROTECTED ROUTES - Tasks Feature (Person 5)
      // ============================================
      {
        path: 'tasks',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/tasks/tasks/tasks.component').then((m) => m.TasksComponent),
            data: { title: 'My Tasks' },
            resolve: { tasks: tasksResolver },
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/tasks/task-form/task-form.component').then(
                (m) => m.TaskFormComponent
              ),
            data: { title: 'Create Task' },
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/tasks/task-form/task-form.component').then(
                (m) => m.TaskFormComponent
              ),
            data: { title: 'Create Task' },
          },
        ],
      },


      {
        path: 'profile/edit',
        loadComponent: () => import('./features/profile/profile-form/profile-form.component').then(m => m.ProfileFormComponent),
        data: { title: 'Edit Profile' },
      },
      {
        path: 'settings/edit',
        loadComponent: () => import('./features/settings/settings-form/settings-form.component').then(m => m.SettingsFormComponent),
        data: { title: 'Settings' },
      },


      {
        path: 'profile',
        redirectTo: 'profile/edit',
        pathMatch: 'full',
      },
      {
        path: 'settings',
        redirectTo: 'settings/edit',
        pathMatch: 'full',
      },


      {
        path: 'profile/edit',
        loadComponent: () => import('./features/profile/profile-form/profile-form.component').then(m => m.ProfileFormComponent),
        data: { title: 'Edit Profile' },
      },
      {
        path: 'settings/edit',
        loadComponent: () => import('./features/settings/settings-form/settings-form.component').then(m => m.SettingsFormComponent),
        data: { title: 'Settings' },
      },


      {
        path: 'profile',
        redirectTo: 'profile/edit',
        pathMatch: 'full',
      },
      {
        path: 'settings',
        redirectTo: 'settings/edit',
        pathMatch: 'full',
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
      // SETTINGS, NOTIFICATIONS, SEARCH
      // ============================================
      // {
      //   path: 'settings',
      //   loadComponent: () =>
      //     import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      //   data: { title: 'Settings' },
      // },
      // {
      //   path: 'notifications',
      //   loadComponent: () =>
      //     import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      //   data: { title: 'Notifications' },
      // },
      // {
      //   path: 'search',
      //   loadComponent: () =>
      //     import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      //   data: { title: 'Search' },
      // },

      // ============================================
      // ADMIN ROUTES
      // ============================================
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/admin/admin.component').then((m) => m.AdminComponent),
            data: { title: 'Admin Dashboard' },
          },
        ],
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