import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';

import { guestOnly } from '@core/guards/guest-only.guard';
import { profileStep } from '@core/guards/profile-step.guard';

import { AuthFlowStore } from './state/auth.store';

/** The code screen only makes sense after a code request. */
const codeRequested: CanActivateFn = () =>
  inject(AuthFlowStore).identifier() ? true : inject(Router).parseUrl('/auth');

/** Child confirmation and parent number: after a recognised invitation code. */
const invitationRecognised: CanActivateFn = () =>
  inject(AuthFlowStore).invitation() ? true : inject(Router).parseUrl('/auth/invitation');

/**
 * Parental consents (RI-20): only once the server has said, for this invitation
 * and this contact, that the acceptance asks for some. When it asks for none,
 * the flow never comes here — and a link that does is sent back to the number.
 */
export const consentsRequired: CanActivateFn = () => {
  const store = inject(AuthFlowStore);
  return store.identifier() && store.requiredConsents()?.length
    ? true
    : inject(Router).parseUrl('/auth/invitation/phone');
};

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    providers: [AuthFlowStore],
    children: [
      {
        path: '',
        canActivate: [guestOnly],
        loadComponent: () =>
          import('./pages/welcome-page/welcome-page').then((m) => m.WelcomePageComponent),
      },
      {
        path: 'sign-up',
        canActivate: [guestOnly],
        data: { intent: 'sign-up' },
        loadComponent: () =>
          import('./pages/identifier-page/identifier-page').then((m) => m.IdentifierPageComponent),
      },
      {
        path: 'sign-in',
        canActivate: [guestOnly],
        data: { intent: 'sign-in' },
        loadComponent: () =>
          import('./pages/identifier-page/identifier-page').then((m) => m.IdentifierPageComponent),
      },
      {
        path: 'invitation',
        canActivate: [guestOnly],
        loadComponent: () =>
          import('./pages/invitation-page/invitation-page').then((m) => m.InvitationPageComponent),
      },
      {
        path: 'invitation/child',
        canActivate: [guestOnly, invitationRecognised],
        loadComponent: () =>
          import('./pages/child-page/child-page').then((m) => m.ChildPageComponent),
      },
      {
        path: 'invitation/phone',
        canActivate: [guestOnly, invitationRecognised],
        data: { intent: 'invitation' },
        loadComponent: () =>
          import('./pages/identifier-page/identifier-page').then((m) => m.IdentifierPageComponent),
      },
      {
        // After the number (its country counts, RI-20), before the code and the acceptance.
        path: 'invitation/consents',
        canActivate: [guestOnly, invitationRecognised, consentsRequired],
        loadComponent: () =>
          import('./pages/consents-page/consents-page').then((m) => m.ConsentsPageComponent),
      },
      {
        path: 'code',
        canActivate: [guestOnly, codeRequested],
        loadComponent: () => import('./pages/code-page/code-page').then((m) => m.CodePageComponent),
      },
      {
        path: 'profile',
        canActivate: [profileStep('teacher')],
        loadComponent: () =>
          import('./pages/profile-page/profile-page').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'alerts',
        canActivate: [profileStep('parent')],
        loadComponent: () =>
          import('./pages/alerts-page/alerts-page').then((m) => m.AlertsPageComponent),
      },
    ],
  },
];
