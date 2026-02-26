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
        loadChildren: () =>
          import('../lodgings/lodgings.routes').then((m) => m.LODGINGS_ROUTES),
      },
      {
        path: 'contacts',
        loadChildren: () =>
          import('../contacs/contacs.routes').then((m) => m.CONTACS_ROUTES),
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
      {
        path: 'profile',
        loadChildren: () =>
          import('../profile/profile.routes').then((m) => m.PROFILE_ROUTES),
      },
    ],
  },
];
