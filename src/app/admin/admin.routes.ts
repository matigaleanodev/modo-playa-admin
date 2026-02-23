import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'lodgings',
        loadComponent: () =>
          import('../lodgings/lodgings.page').then((m) => m.LodgingsPage),
      },
      {
        path: 'contacts',
        loadComponent: () =>
          import('../contacs/contacs.page').then((m) => m.ContacsPage),
      },
      {
        path: 'contacs',
        redirectTo: 'contacts',
        pathMatch: 'full',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('../users/users.page').then((m) => m.UsersPage),
      },
    ],
  },
];
