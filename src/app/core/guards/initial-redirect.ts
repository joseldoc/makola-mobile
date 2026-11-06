import { inject } from '@angular/core';
import { RedirectFunction, Router } from '@angular/router';

import { SessionStore } from '@core/store/session/session.store';

/** Empty route: everyone lands where their account stands (onboarding, sign-in, profile, home). */
export const initialRedirect: RedirectFunction = () => {
  const session = inject(SessionStore);
  return inject(Router).parseUrl(session.initialRoute());
};
