import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile-view/profile-view.page').then(
        (m) => m.ProfileViewPage,
      ),
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./pages/profile-edit/profile-edit.page').then(
        (m) => m.ProfileEditPage,
      ),
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./pages/profile-change-password/profile-change-password.page').then(
        (m) => m.ProfileChangePasswordPage,
      ),
  },
];
