import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'folder/inbox',
    pathMatch: 'full',
  },
  {
    path: 'folder/:id',
    loadComponent: () =>
      import('./folder/folder.page').then((m) => m.FolderPage),
  },
  {
    path: 'lodgings',
    loadComponent: () => import('./lodgings/lodgings.page').then( m => m.LodgingsPage)
  },
  {
    path: 'contacs',
    loadComponent: () => import('./contacs/contacs.page').then( m => m.ContacsPage)
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users.page').then( m => m.UsersPage)
  },
];
