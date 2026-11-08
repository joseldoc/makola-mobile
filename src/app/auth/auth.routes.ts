import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';

import { guestOnly } from '@core/guards/guest-only.guard';
import { profileStep } from '@core/guards/profile-step.guard';
import { SessionStore } from '@core/store/session/session.store';

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

/**
 * Entry of the invitation flow for a signed-in account (A-23, 8 November 2026),
 * opened by « Join with an invitation code » in its account sheet: the flow
 * starts again in joining mode, the session stays open. A guest goes to the
 * invitation code as usual.
 */
export const joinEntry: CanActivateFn = () => {
  if (inject(SessionStore).hasReadySpace()) inject(AuthFlowStore).join();
  return inject(Router).parseUrl('/auth/invitation');
};

/**
 * The invitation screens: a guest, as `guestOnly` lets in — or a signed-in
 * account that came in through `joinEntry` (A-23). Any other signed-in account
 * goes back to where it stands.
 */
export const guestOrJoining: CanActivateFn = () => {
  const session = inject(SessionStore);
  if (!session.hasReadySpace() || inject(AuthFlowStore).joining()) return true;
  return inject(Router).parseUrl(session.initialRoute());
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
        // A-23: the account sheet's entry — a redirect that opens the flow to the account.
        path: 'join',
        canActivate: [joinEntry],
        children: [],
      },
      {
        path: 'invitation',
        canActivate: [guestOrJoining],
        loadComponent: () =>
          import('./pages/invitation-page/invitation-page').then((m) => m.InvitationPageComponent),
      },
      {
        path: 'invitation/child',
        canActivate: [guestOrJoining, invitationRecognised],
        loadComponent: () =>
          import('./pages/child-page/child-page').then((m) => m.ChildPageComponent),
      },
      {
        path: 'invitation/phone',
        canActivate: [guestOrJoining, invitationRecognised],
        data: { intent: 'invitation' },
        loadComponent: () =>
          import('./pages/identifier-page/identifier-page').then((m) => m.IdentifierPageComponent),
      },
      {
        // After the number (its country counts, RI-20), before the code and the acceptance.
        path: 'invitation/consents',
        canActivate: [guestOrJoining, invitationRecognised, consentsRequired],
        loadComponent: () =>
          import('./pages/consents-page/consents-page').then((m) => m.ConsentsPageComponent),
      },
      {
        // Joining (A-23) ends with the code: the acceptance is made for the account.
        path: 'code',
        canActivate: [guestOrJoining, codeRequested],
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
