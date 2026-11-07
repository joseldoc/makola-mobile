import { inject } from '@angular/core';
import { RedirectFunction, Router } from '@angular/router';

import { SessionStore } from '@core/store/session/session.store';

/**
 * Empty route: everyone lands where their account stands — onboarding, sign-in,
 * or the active space (its step 2, or its home).
 */
export const initialRedirect: RedirectFunction = () => {
  const session = inject(SessionStore);
  return inject(Router).parseUrl(session.initialRoute());
};
