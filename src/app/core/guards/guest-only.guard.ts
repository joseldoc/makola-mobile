import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionStore } from '@core/store/session/session.store';

/**
 * Onboarding and sign-in: only for someone without an active account — no
 * session, or a session none of whose spaces is ready yet (step 2 still to do:
 * going back to start over stays possible). Whoever has a ready space goes to
 * where their account stands.
 */
export const guestOnly: CanActivateFn = () => {
  const session = inject(SessionStore);
  return session.hasReadySpace() ? inject(Router).parseUrl(session.initialRoute()) : true;
};
