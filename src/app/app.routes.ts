import { Routes } from '@angular/router';
import { noAuthGuard } from '@auth/guard/no-auth-guard';

export const routes: Routes = [
  {
    path: 'auth',
    canMatch: [noAuthGuard],
    loadChildren: () => import('@auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'app',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'lodgings',
    redirectTo: 'app/lodgings',
    pathMatch: 'full',
  },
  {
    path: 'contacts',
    redirectTo: 'app/contacts',
    pathMatch: 'full',
  },
  {
    path: 'users',
    redirectTo: 'app/users',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    redirectTo: 'app/profile',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
];
