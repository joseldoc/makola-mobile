import { inject } from '@angular/core';
import { CanActivateFn, RedirectFunction, Router } from '@angular/router';

import { SessionStore } from '@core/store/session/session.store';
import { Role } from './auth.model';

/** Empty route: everyone lands where their account stands (onboarding, sign-in, profile, home). */
export const initialRedirect: RedirectFunction = () => {
  const session = inject(SessionStore);
  return inject(Router).parseUrl(session.initialRoute());
};

/** App screens: active account with the right role, otherwise back to the entry point. */
export function activeAccount(role: Role): CanActivateFn {
  return () => {
    const session = inject(SessionStore);
    if (session.active() && session.role() === role) return true;
    return inject(Router).parseUrl(session.initialRoute());
  };
}

/** Onboarding and sign-in: only for someone without an active account. */
export const guestOnly: CanActivateFn = () => {
  const session = inject(SessionStore);
  return session.active() ? inject(Router).parseUrl(session.initialRoute()) : true;
};

/** Onboarding is not replayed once seen. */
export const onboardingNotSeen: CanActivateFn = () => {
  const session = inject(SessionStore);
  return session.onboardingSeen() ? inject(Router).parseUrl(session.initialRoute()) : true;
};

/** Step 2 (teacher profile, parent alerts): session open but account not active yet. */
export function profileStep(role: Role): CanActivateFn {
  return () => {
    const session = inject(SessionStore);
    if (session.signedIn() && !session.active() && session.role() === role) return true;
    return inject(Router).parseUrl(session.initialRoute());
  };
}
