import { Routes } from '@angular/router';

export const ASSIGNMENT_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/assignment-page/assignment-page').then((m) => m.AssignmentPageComponent),
  },
];
