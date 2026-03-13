import { Routes } from '@angular/router';
import { contactEditResolver } from './resolvers/contact-edit.resolver';

export const CONTACTS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/contacts-list/contacts-list.page').then(
            (m) => m.ContactsListPage,
          ),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./pages/contacts-form/contacts-form.page').then(
            (m) => m.ContactsFormPage,
          ),
      },
      {
        path: ':id',
        resolve: {
          contact: contactEditResolver,
        },
        loadComponent: () =>
          import('./pages/contacts-form/contacts-form.page').then(
            (m) => m.ContactsFormPage,
          ),
      },
    ],
  },
];

export const CONTACS_ROUTES = CONTACTS_ROUTES;
