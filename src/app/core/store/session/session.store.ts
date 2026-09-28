import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { Session } from '@core/auth/auth.model';

const CLE_SESSION = 'mk.session';
const CLE_ONBOARDING = 'mk.onboarding-vu';

interface SessionState {
  session: Session | null;
  /** La présentation (4 écrans) n'est montrée qu'une fois par appareil. */
  onboardingVu: boolean;
}

/**
 * Session de l'utilisateur et passage de la présentation. Persistée dans le
 * `localStorage` (API web : aucune fonction native n'est nécessaire ici).
 * Lue de façon synchrone à la création, pour que les gardes de route décident
 * dès la première navigation.
 */
export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState<SessionState>(() => ({
    session: lire<Session>(CLE_SESSION),
    onboardingVu: lire<boolean>(CLE_ONBOARDING) ?? false
  })),
  withComputed(({ session, onboardingVu }) => ({
    connecte: computed(() => session() !== null),
    actif: computed(() => session()?.profilComplet ?? false),
    role: computed(() => session()?.role ?? null),
    /** Où envoyer l'utilisateur selon l'état de son compte. */
    routeInitiale: computed(() => {
      const s = session();
      if (!s) return onboardingVu() ? '/auth' : '/onboarding';
      if (!s.profilComplet) return s.role === 'prof' ? '/auth/profil' : '/auth/alertes';
      return s.role === 'prof' ? '/classe' : '/fil-parent';
    })
  })),
  withMethods((store) => ({
    terminerOnboarding(): void {
      patchState(store, { onboardingVu: true });
      ecrire(CLE_ONBOARDING, true);
    },
    ouvrir(session: Session): void {
      patchState(store, { session });
      ecrire(CLE_SESSION, session);
    },
    fermer(): void {
      patchState(store, { session: null });
      ecrire(CLE_SESSION, null);
    }
  }))
);

function lire<T>(cle: string): T | null {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: unknown): void {
  try {
    if (valeur === null) localStorage.removeItem(cle);
    else localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // Stockage indisponible : l'état reste valable pour cette ouverture de l'app.
  }
}
