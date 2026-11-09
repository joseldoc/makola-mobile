import { Routes } from '@angular/router';

import { activeAccount } from '@core/guards/active-account.guard';
import { initialRedirect } from '@core/guards/initial-redirect';

// Importing a feature's *.routes.ts is a synchronous import of a Route[] array:
// the lazy chunks come from each leaf's loadComponent, one chunk per page.
import { ASSIGNMENT_ROUTES } from './assignment/assignment.routes';
import { AUTH_ROUTES } from './auth/auth.routes';
import { CLASSROOM_ROUTES } from './classroom/classroom.routes';
import { GRADE_ENTRY_ROUTES } from './grade-entry/grade-entry.routes';
import { ONBOARDING_ROUTES } from './onboarding/onboarding.routes';
import { PARENT_FEED_ROUTES } from './parent-feed/parent-feed.routes';
import { STUDENT_ROUTES } from './student/student.routes';

export const routes: Routes = [
  {
    path: 'onboarding',
    children: ONBOARDING_ROUTES,
  },
  {
    path: 'auth',
    children: AUTH_ROUTES,
  },
  {
    path: 'classroom',
    canActivate: [activeAccount('teacher')],
    children: CLASSROOM_ROUTES,
  },
  {
    path: 'grade-entry',
    canActivate: [activeAccount('teacher')],
    children: GRADE_ENTRY_ROUTES,
  },
  {
    path: 'assignment',
    canActivate: [activeAccount('teacher')],
    children: ASSIGNMENT_ROUTES,
  },
  {
    path: 'parent-feed',
    canActivate: [activeAccount('parent')],
    children: PARENT_FEED_ROUTES,
  },
  // A student's page, in both spaces (US-P08): each entry carries its space's guard.
  {
    path: 'student',
    children: STUDENT_ROUTES,
  },
  // Everyone lands where their account stands: onboarding, sign-in, profile or home.
  { path: '', pathMatch: 'full', redirectTo: initialRedirect },
  { path: '**', redirectTo: initialRedirect },
];
