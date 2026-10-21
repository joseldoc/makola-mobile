import { Routes } from '@angular/router';

export const ASSIGNMENT_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () => import('./pages').then((m) => m.AssignmentPageComponent)
  }
];
