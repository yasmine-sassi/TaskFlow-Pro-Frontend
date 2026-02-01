import { Routes } from '@angular/router';
import { tasksResolver } from '../../core/resolvers';

export const tasksRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tasks/tasks.component').then((m) => m.TasksComponent),
    data: { title: 'My Tasks' },
    resolve: { tasks: tasksResolver },
  },
];
