import { Routes } from '@angular/router';
import { projectMemberGuard } from '../../core/guards/project-member.guard';
import { projectResolver, projectsResolver } from '../../core/resolvers';

export const projectsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./projects/projects.component').then((m) => m.ProjectsComponent),
    data: { title: 'Projects' },
    resolve: { projects: projectsResolver },
  },
  {
    path: ':projectId',
    canActivate: [projectMemberGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('../board/board.component').then((m) => m.BoardComponent),
        data: { title: 'Project Board' },
        resolve: { project: projectResolver },
      },
    ],
  },
];
