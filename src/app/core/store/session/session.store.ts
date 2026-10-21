import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { ROLES, Session } from '@core/auth/auth.model';

const SESSION_KEY = 'mk.session';
const ONBOARDING_KEY = 'mk.onboarding-seen';

interface SessionState {
  session: Session | null;
  /** The onboarding (4 screens) is shown once per device. */
  onboardingSeen: boolean;
}

/**
 * User session and onboarding progress. Persisted in `localStorage` (a web
 * API: no native feature is needed here). Read synchronously at creation so
 * route guards can decide on the very first navigation.
 */
export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState<SessionState>(() => ({
    session: readSession(),
    onboardingSeen: read<boolean>(ONBOARDING_KEY) ?? false
  })),
  withComputed(({ session, onboardingSeen }) => ({
    signedIn: computed(() => session() !== null),
    active: computed(() => session()?.profileComplete ?? false),
    role: computed(() => session()?.role ?? null),
    /** Where to send the user depending on the state of their account. */
    initialRoute: computed(() => {
      const s = session();
      if (!s) return onboardingSeen() ? '/auth' : '/onboarding';
      if (!s.profileComplete) return s.role === 'teacher' ? '/auth/profile' : '/auth/alerts';
      return s.role === 'teacher' ? '/classroom' : '/parent-feed';
    })
  })),
  withMethods((store) => ({
    completeOnboarding(): void {
      patchState(store, { onboardingSeen: true });
      write(ONBOARDING_KEY, true);
    },
    open(session: Session): void {
      patchState(store, { session });
      write(SESSION_KEY, session);
    },
    close(): void {
      patchState(store, { session: null });
      write(SESSION_KEY, null);
    }
  }))
);

/**
 * A session saved by an older version of the app (e.g. role `prof` before the
 * code went English) is dropped: the guards would otherwise redirect forever
 * between `initialRoute` and a guard that refuses it — a white screen at launch.
 */
function readSession(): Session | null {
  const session = read<Session>(SESSION_KEY);
  if (session && ROLES.includes(session.role) && typeof session.profileComplete === 'boolean') return session;
  if (session) write(SESSION_KEY, null);
  return null;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the state stays valid for this app launch.
  }
}
