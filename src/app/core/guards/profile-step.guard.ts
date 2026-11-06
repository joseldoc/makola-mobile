import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from '@core/models/auth.model';
import { SessionStore } from '@core/store/session/session.store';

/**
 * Step 2 of a space (teacher profile, parent alerts): session open, the account
 * holds `role` and its step 2 is not done yet — each role has its own.
 *
 * Like `activeAccount`, entering it makes `role` the active one: a launch in the
 * middle of the step comes back to it.
 */
export function profileStep(role: Role): CanActivateFn {
  return () => {
    const session = inject(SessionStore);
    if (!session.hasRole(role) || session.isReady(role))
      return inject(Router).parseUrl(session.initialRoute());
    session.switchSpace(role);
    return true;
  };
}
