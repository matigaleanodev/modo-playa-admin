import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('@auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'lodgings',
    loadComponent: () =>
      import('./lodgings/lodgings.page').then((m) => m.LodgingsPage),
  },
  {
    path: 'contacs',
    loadComponent: () =>
      import('./contacs/contacs.page').then((m) => m.ContacsPage),
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users.page').then((m) => m.UsersPage),
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
];
