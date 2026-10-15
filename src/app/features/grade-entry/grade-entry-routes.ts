import { Routes } from '@angular/router';

export const GRADE_ENTRY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages').then((m) => m.GradeEntryPageComponent)
  }
];
