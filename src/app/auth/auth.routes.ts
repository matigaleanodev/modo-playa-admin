import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'activate',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/account-activation/account-activation.page').then(
            (m) => m.AccountActivationPage,
          ),
      },
      {
        path: 'verify',
        loadComponent: () =>
          import('./pages/account-activation-verify/account-activation-verify.page').then(
            (m) => m.AccountActivationVerifyPage,
          ),
      },
      {
        path: 'set-password',
        loadComponent: () =>
          import('./pages/account-activation-set-password/account-activation-set-password.page').then(
            (m) => m.AccountActivationSetPasswordPage,
          ),
      },
    ],
  },
  {
    path: 'forgot-password',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password.page').then(
            (m) => m.ForgotPasswordPage,
          ),
      },
      {
        path: 'verify',
        loadComponent: () =>
          import('./pages/forgot-password-verify/forgot-password-verify.page').then(
            (m) => m.ForgotPasswordVerifyPage,
          ),
      },
      {
        path: 'reset',
        loadComponent: () =>
          import('./pages/forgot-password-reset/forgot-password-reset.page').then(
            (m) => m.ForgotPasswordResetPage,
          ),
      },
    ],
  },
];
