import { Routes } from '@angular/router';
import { lodgingEditResolver } from './resolvers/lodging-edit.resolver';

export const LODGINGS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/lodgings-list/lodgings-list.page').then(
            (m) => m.LodgingsListPage,
          ),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./pages/lodgings-form/lodgings-form.page').then(
            (m) => m.LodgingsFormPage,
          ),
      },
      {
        path: ':id',
        resolve: {
          lodging: lodgingEditResolver,
        },
        loadComponent: () =>
          import('./pages/lodgings-form/lodgings-form.page').then(
            (m) => m.LodgingsFormPage,
          ),
      },
      {
        path: ':id/availability',
        resolve: {
          lodging: lodgingEditResolver,
        },
        loadComponent: () =>
          import('./pages/lodgings-availability/lodgings-availability.page').then(
            (m) => m.LodgingsAvailabilityPage,
          ),
      },
    ],
  },
];
