import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'classe',
    loadChildren: () => import('./features/classe/classe-routes').then((m) => m.CLASSE_ROUTES)
  },
  {
    path: 'saisie',
    loadChildren: () => import('./features/saisie/saisie-routes').then((m) => m.SAISIE_ROUTES)
  },
  {
    path: 'devoir',
    loadChildren: () => import('./features/devoir/devoir-routes').then((m) => m.DEVOIR_ROUTES)
  },
  {
    path: 'fil-parent',
    loadChildren: () => import('./features/fil-parent/fil-parent-routes').then((m) => m.FIL_PARENT_ROUTES)
  },
  { path: '', redirectTo: 'classe', pathMatch: 'full' }
];
