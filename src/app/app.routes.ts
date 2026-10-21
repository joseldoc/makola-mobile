import { Routes } from '@angular/router';

import { activeAccount, initialRedirect } from '@core/auth/guards';

export const routes: Routes = [
  {
    path: 'onboarding',
    loadChildren: () => import('./features/onboarding').then((m) => m.ONBOARDING_ROUTES)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth').then((m) => m.AUTH_ROUTES)
  },
  {
    path: 'classroom',
    canActivate: [activeAccount('teacher')],
    loadChildren: () => import('./features/classroom').then((m) => m.CLASSROOM_ROUTES)
  },
  {
    path: 'grade-entry',
    canActivate: [activeAccount('teacher')],
    loadChildren: () => import('./features/grade-entry').then((m) => m.GRADE_ENTRY_ROUTES)
  },
  {
    path: 'assignment',
    canActivate: [activeAccount('teacher')],
    loadChildren: () => import('./features/assignment').then((m) => m.ASSIGNMENT_ROUTES)
  },
  {
    path: 'parent-feed',
    canActivate: [activeAccount('parent')],
    loadChildren: () => import('./features/parent-feed').then((m) => m.PARENT_FEED_ROUTES)
  },
  // Everyone lands where their account stands: onboarding, sign-in, profile or home.
  { path: '', pathMatch: 'full', redirectTo: initialRedirect },
  { path: '**', redirectTo: initialRedirect }
];
