import { Routes } from '@angular/router';

export const FIL_PARENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages').then((m) => m.FilParentPageComponent)
  }
];
