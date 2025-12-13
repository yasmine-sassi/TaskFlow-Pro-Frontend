import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // {
  //   path: 'auth/login',
  //   loadComponent: () =>
  //     import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  // },
  // {
  //   path: 'dashboard',
  //   loadComponent: () =>
  //     import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  //   canActivate: [authGuard], // ✅ Protected route
  // },
  // {
  //   path: 'projects',
  //   loadComponent: () =>
  //     import('./features/projects/projects.component').then((m) => m.ProjectsComponent),
  //   canActivate: [authGuard],
  // },
  // {
  //   path: 'admin',
  //   loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
  //   canActivate: [authGuard, adminGuard], // ✅ Auth + Admin required
  // },
  // {
  //   path: 'projects/:projectId',
  //   loadComponent: () =>
  //     import('./features/projects/project-details/project-details.component').then(
  //       (m) => m.ProjectDetailsComponent
  //     ),
  //   canActivate: [authGuard, projectMemberGuard],
  // },
  // {
  //   path: 'projects/:projectId/view',
  //   canActivate: [projectMemberGuard({ minRole: ProjectMemberRole.VIEWER })],
  // },
  // {
  //   path: 'projects/:projectId/edit',
  //   canActivate: [projectMemberGuard({ minRole: ProjectMemberRole.EDITOR })],
  // },
  // {
  //   path: 'projects/:projectId/settings',
  //   canActivate: [projectMemberGuard({ minRole: ProjectMemberRole.OWNER })],
  // },
  // // ... more protected routes
];
