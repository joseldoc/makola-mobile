import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from '@core/models/auth.model';
import { SessionStore } from '@core/store/session/session.store';

/**
 * A space's screens: the account holds `role` and its step 2 is done, otherwise
 * back to where the account stands.
 *
 * Entering the space makes it the active one, whether by the app-bar action or
 * by a link (a notification, a shared URL): the space shown is always the
 * active one, so the app reopens the last space shown.
 */
export function activeAccount(role: Role): CanActivateFn {
  return () => {
    const session = inject(SessionStore);
    if (!session.isReady(role)) return inject(Router).parseUrl(session.initialRoute());
    session.switchSpace(role);
    return true;
  };
}
