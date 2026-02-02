import { Routes } from '@angular/router';
import { projectResolver, projectsResolver } from '../../core/resolvers';
import { projectMemberGuard } from '../../core/guards/project-member.guard';
import { ProjectMemberRole } from '../../core/models/project.model';

export const projectsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./projects/projects.component').then((m) => m.ProjectsComponent),
    data: { title: 'Projects' },
    resolve: { projects: projectsResolver },
  },
  {
    path: ':projectId',
    loadComponent: () => import('./projects/projects.component').then((m) => m.ProjectsComponent),
    data: { title: 'Projects' },
    canActivate: [projectMemberGuard({ minRole: ProjectMemberRole.VIEWER })],
    resolve: { projects: projectsResolver },
  },
  {
    path: ':projectId/board',
    loadComponent: () => import('../board/board.component').then((m) => m.BoardComponent),
    data: { title: 'Project Board' },
    canActivate: [projectMemberGuard({ minRole: ProjectMemberRole.VIEWER })],
    resolve: { project: projectResolver },
  },
];
