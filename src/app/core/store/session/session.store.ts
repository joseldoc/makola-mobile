import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { Role, Session } from '@core/models/auth.model';
import { heldRoles, parseSession, showing } from '@core/models/session';

const SESSION_KEY = 'mk.session';
const ONBOARDING_KEY = 'mk.onboarding-seen';

/** Each space: its step 2, then its home. A new space is an entry here. */
const SPACE_ROUTES: Record<Role, { setup: string; home: string }> = {
  teacher: { setup: '/auth/profile', home: '/classroom' },
  parent: { setup: '/auth/alerts', home: '/parent-feed' },
};

interface SessionState {
  session: Session | null;
  /** The onboarding (4 screens) is shown once per device. */
  onboardingSeen: boolean;
}

/**
 * User session and onboarding progress. Persisted in `localStorage` (a web
 * API: no native feature is needed here). Read synchronously at creation so
 * route guards can decide on the very first navigation.
 *
 * An account holds one or two roles (ID-02); the session shows one space at a
 * time, the active role. It is persisted with the session, so the app reopens
 * the last space shown.
 */
export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState<SessionState>(() => ({
    session: readSession(),
    onboardingSeen: read<boolean>(ONBOARDING_KEY) ?? false,
  })),
  withComputed(({ session, onboardingSeen }) => {
    /** The active space has its step 2 done. */
    const ready = computed(() => {
      const s = session();
      return s !== null && s.roles[s.activeRole] === 'ready';
    });
    return {
      signedIn: computed(() => session() !== null),
      /** The roles of the account, in `ROLES` order; none when signed out. */
      roles: computed<Role[]>(() => {
        const s = session();
        return s ? heldRoles(s) : [];
      }),
      /** The space shown. */
      activeRole: computed<Role | null>(() => session()?.activeRole ?? null),
      ready,
      /** At least one space of the account is ready: its holder is no longer a guest. */
      hasReadySpace: computed(() => {
        const s = session();
        return s !== null && heldRoles(s).some((role) => s.roles[role] === 'ready');
      }),
      /** Where to send the user: onboarding or sign-in, else the active space — its step 2 or its home. */
      initialRoute: computed(() => {
        const s = session();
        if (!s) return onboardingSeen() ? '/auth' : '/onboarding';
        const routes = SPACE_ROUTES[s.activeRole];
        return ready() ? routes.home : routes.setup;
      }),
    };
  }),
  withMethods((store) => ({
    /** The account holds `role`. Reactive when read in a `computed`. */
    hasRole(role: Role): boolean {
      return store.session()?.roles[role] !== undefined;
    },
    /** The account holds `role` and its step 2 is done. Reactive when read in a `computed`. */
    isReady(role: Role): boolean {
      return store.session()?.roles[role] === 'ready';
    },
    completeOnboarding(): void {
      patchState(store, { onboardingSeen: true });
      write(ONBOARDING_KEY, true);
    },
    open(session: Session): void {
      patchState(store, { session });
      write(SESSION_KEY, session);
    },
    /** Signs out of the account — every role at once. */
    close(): void {
      patchState(store, { session: null });
      write(SESSION_KEY, null);
    },
    /**
     * Shows `role`'s space and keeps that choice for the next launch. Without
     * effect when the account does not hold `role`.
     */
    switchSpace(role: Role): void {
      const current = store.session();
      if (!current || current.activeRole === role) return;
      const switched = showing(current, role);
      if (!switched) return;
      patchState(store, { session: switched });
      write(SESSION_KEY, switched);
    },
  })),
);

/**
 * A session saved by an older version of the app is converted when its form is
 * known (the single-role form before ID-02), and dropped otherwise (e.g. role
 * `prof` before the code went English): the guards would otherwise redirect
 * forever between `initialRoute` and a guard that refuses it — a white screen
 * at launch.
 */
function readSession(): Session | null {
  const stored = read<unknown>(SESSION_KEY);
  if (stored === null) return null;
  const session = parseSession(stored);
  // Written back in the current form, or removed.
  write(SESSION_KEY, session);
  return session;
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
