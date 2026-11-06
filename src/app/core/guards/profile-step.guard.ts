import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from '@core/models/auth.model';
import { SessionStore } from '@core/store/session/session.store';

/** Step 2 (teacher profile, parent alerts): session open but account not active yet. */
export function profileStep(role: Role): CanActivateFn {
  return () => {
    const session = inject(SessionStore);
    if (session.signedIn() && !session.active() && session.role() === role) return true;
    return inject(Router).parseUrl(session.initialRoute());
  };
}
