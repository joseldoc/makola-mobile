import { Routes } from '@angular/router';

export const CLASSROOM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/classroom-page/classroom-page').then((m) => m.ClassroomPageComponent),
  },
];
