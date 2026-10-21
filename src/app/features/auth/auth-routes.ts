import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';

import { guestOnly, profileStep } from '@core/auth/guards';

import { AuthFlowStore } from './auth.store';

/** The code screen only makes sense after a code request. */
const codeRequested: CanActivateFn = () =>
  inject(AuthFlowStore).identifier() ? true : inject(Router).parseUrl('/auth');

/** Child confirmation and parent number: after a recognised invitation code. */
const invitationRecognised: CanActivateFn = () =>
  inject(AuthFlowStore).invitation() ? true : inject(Router).parseUrl('/auth/invitation');

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    providers: [AuthFlowStore],
    children: [
      {
        path: '',
        canActivate: [guestOnly],
        loadComponent: () => import('./pages').then((m) => m.WelcomePageComponent)
      },
      {
        path: 'sign-up',
        canActivate: [guestOnly],
        data: { intent: 'sign-up' },
        loadComponent: () => import('./pages').then((m) => m.IdentifierPageComponent)
      },
      {
        path: 'sign-in',
        canActivate: [guestOnly],
        data: { intent: 'sign-in' },
        loadComponent: () => import('./pages').then((m) => m.IdentifierPageComponent)
      },
      {
        path: 'invitation',
        canActivate: [guestOnly],
        loadComponent: () => import('./pages').then((m) => m.InvitationPageComponent)
      },
      {
        path: 'invitation/child',
        canActivate: [guestOnly, invitationRecognised],
        loadComponent: () => import('./pages').then((m) => m.ChildPageComponent)
      },
      {
        path: 'invitation/phone',
        canActivate: [guestOnly, invitationRecognised],
        data: { intent: 'invitation' },
        loadComponent: () => import('./pages').then((m) => m.IdentifierPageComponent)
      },
      {
        path: 'code',
        canActivate: [guestOnly, codeRequested],
        loadComponent: () => import('./pages').then((m) => m.CodePageComponent)
      },
      {
        path: 'profile',
        canActivate: [profileStep('teacher')],
        loadComponent: () => import('./pages').then((m) => m.ProfilePageComponent)
      },
      {
        path: 'alerts',
        canActivate: [profileStep('parent')],
        loadComponent: () => import('./pages').then((m) => m.AlertsPageComponent)
      }
    ]
  }
];
