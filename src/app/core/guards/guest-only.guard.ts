import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionStore } from '@core/store/session/session.store';

/** Onboarding and sign-in: only for someone without an active account. */
export const guestOnly: CanActivateFn = () => {
  const session = inject(SessionStore);
  return session.active() ? inject(Router).parseUrl(session.initialRoute()) : true;
};
