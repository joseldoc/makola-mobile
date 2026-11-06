import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionStore } from '@core/store/session/session.store';

/** Onboarding is not replayed once seen. */
export const onboardingNotSeen: CanActivateFn = () => {
  const session = inject(SessionStore);
  return session.onboardingSeen() ? inject(Router).parseUrl(session.initialRoute()) : true;
};
