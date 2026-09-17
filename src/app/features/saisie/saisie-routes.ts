import { Routes } from '@angular/router';

export const SAISIE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages').then((m) => m.SaisiePageComponent)
  }
];
