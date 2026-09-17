import { Routes } from '@angular/router';

export const DEVOIR_ROUTES: Routes = [
  {
    path: 'nouveau',
    loadComponent: () => import('./pages').then((m) => m.DevoirPageComponent)
  }
];
