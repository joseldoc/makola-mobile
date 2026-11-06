import { Routes } from '@angular/router';

export const GRADE_ENTRY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/grade-entry-page/grade-entry-page').then((m) => m.GradeEntryPageComponent),
  },
];
