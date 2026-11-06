import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from '@core/models/auth.model';
import { SessionStore } from '@core/store/session/session.store';

/** App screens: active account with the right role, otherwise back to the entry point. */
export function activeAccount(role: Role): CanActivateFn {
  return () => {
    const session = inject(SessionStore);
    if (session.active() && session.role() === role) return true;
    return inject(Router).parseUrl(session.initialRoute());
  };
}
