import { Routes } from '@angular/router';

export const CLASSROOM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages').then((m) => m.ClassroomPageComponent)
  }
];
