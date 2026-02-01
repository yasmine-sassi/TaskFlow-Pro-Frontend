import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin.component').then((m) => m.AdminComponent),
    data: { title: 'Admin Dashboard' },
  },
];
