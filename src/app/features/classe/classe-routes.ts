import { Routes } from '@angular/router';

export const CLASSE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages').then((m) => m.ClassePageComponent)
  }
];
