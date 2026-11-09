import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';

import { activeAccount } from '@core/guards/active-account.guard';

import { ParentFeedStore } from '../parent-feed/state/parent-feed.store';
import { StudentRecordQuery } from './models/student-record.model';
import { StudentPageData } from './models/student-page.model';

/** A teacher's: the class and the student of the address, chosen on the classroom screen. */
const fromAddress: ResolveFn<StudentRecordQuery> = (route) => ({
  classroomId: route.paramMap.get('classroomId') ?? '',
  studentId: route.paramMap.get('studentId') ?? '',
});

/**
 * A parent's: their link, never an address — a parent reads their child, in the
 * subject of the teacher who invited them, and nothing else (A-19).
 */
const fromParentLink: ResolveFn<StudentRecordQuery> = () => inject(ParentFeedStore).link();

/**
 * The student's page (US-P08), one page for both spaces: the space sets its tint
 * and where « back » goes, the query which record it reads. Each entry keeps the
 * guard of its space, which makes it the active one.
 */
export const STUDENT_ROUTES: Routes = [
  {
    path: 'child',
    canActivate: [activeAccount('parent')],
    resolve: { query: fromParentLink },
    data: { space: 'parent', backTo: '/parent-feed' } satisfies StudentPageData,
    loadComponent: () =>
      import('./pages/student-page/student-page').then((m) => m.StudentPageComponent),
  },
  {
    path: ':classroomId/:studentId',
    canActivate: [activeAccount('teacher')],
    resolve: { query: fromAddress },
    data: { space: 'teacher', backTo: '/classroom' } satisfies StudentPageData,
    loadComponent: () =>
      import('./pages/student-page/student-page').then((m) => m.StudentPageComponent),
  },
];
