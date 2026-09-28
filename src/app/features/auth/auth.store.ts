import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { AuthApi, AuthErreur } from '@core/auth/auth-api';
import { AlertesParent, Identifiant, Intention, Invitation, ProfilProfesseur, Session } from '@core/auth/auth.model';
import { SessionStore } from '@core/store/session/session.store';

interface AuthState {
  intention: Intention;
  identifiant: Identifiant | null;
  /** Horodatage (ms) à partir duquel un nouveau code peut être demandé. */
  renvoiPossibleLe: number;
  invitation: Invitation | null;
  enCours: boolean;
  /** Refus du serveur, affichable tel quel. */
  erreur: string;
}

const initialState: AuthState = {
  intention: 'connexion',
  identifiant: null,
  renvoiPossibleLe: 0,
  invitation: null,
  enCours: false,
  erreur: ''
};

const ERREUR_INATTENDUE = "Le serveur n'a pas répondu. Réessayez dans un instant.";

/**
 * État du parcours d'entrée (inscription, connexion, invitation parent), partagé
 * par les écrans de `/auth` — fourni au niveau de la route, oublié en la quittant.
 * La session ouverte, elle, vit dans `SessionStore`.
 */
export const AuthFlowStore = signalStore(
  withState(initialState),
  withMethods((store, api = inject(AuthApi), session = inject(SessionStore)) => {
    /** Exécute un appel serveur : un seul à la fois, refus rangé dans `erreur`. */
    async function appel<T>(action: () => Promise<T>): Promise<T | null> {
      if (store.enCours()) return null;
      patchState(store, { enCours: true, erreur: '' });
      try {
        return await action();
      } catch (e) {
        patchState(store, { erreur: e instanceof AuthErreur ? e.message : ERREUR_INATTENDUE });
        return null;
      } finally {
        patchState(store, { enCours: false });
      }
    }

    return {
      commencer(intention: Intention): void {
        patchState(store, { intention, erreur: '', ...(intention === 'invitation' ? {} : { invitation: null }) });
      },

      effacerErreur(): void {
        if (store.erreur()) patchState(store, { erreur: '' });
      },

      async demanderCode(identifiant: Identifiant): Promise<boolean> {
        const demande = await appel(() => api.demanderCode(identifiant, store.intention()));
        if (!demande) return false;
        patchState(store, { identifiant, renvoiPossibleLe: Date.now() + demande.renvoiDans * 1000 });
        return true;
      },

      async renvoyerCode(): Promise<boolean> {
        const identifiant = store.identifiant();
        if (!identifiant || Date.now() < store.renvoiPossibleLe()) return false;
        const demande = await appel(() => api.demanderCode(identifiant, store.intention()));
        if (!demande) return false;
        patchState(store, { renvoiPossibleLe: Date.now() + demande.renvoiDans * 1000 });
        return true;
      },

      async verifierCode(code: string): Promise<Session | null> {
        const identifiant = store.identifiant();
        if (!identifiant) return null;
        const ouverte = await appel(() =>
          api.verifierCode(identifiant, code, store.intention(), store.invitation() ?? undefined)
        );
        if (ouverte) session.ouvrir(ouverte);
        return ouverte;
      },

      async verifierInvitation(code: string): Promise<boolean> {
        const invitation = await appel(() => api.verifierInvitation(code));
        if (!invitation) return false;
        patchState(store, { invitation, intention: 'invitation' });
        return true;
      },

      refuserInvitation(): void {
        patchState(store, {
          invitation: null,
          erreur: "Aucun rattachement n'a été fait. Demandez au professeur de vérifier l'élève concerné, puis saisissez le nouveau code."
        });
      },

      async completerProfil(profil: ProfilProfesseur): Promise<boolean> {
        const courante = session.session();
        if (!courante) return false;
        const active = await appel(() => api.completerProfil(courante, profil));
        if (active) session.ouvrir(active);
        return active !== null;
      },

      async enregistrerAlertes(alertes: AlertesParent): Promise<boolean> {
        const courante = session.session();
        if (!courante) return false;
        const active = await appel(() => api.enregistrerAlertes(courante, alertes));
        if (active) session.ouvrir(active);
        return active !== null;
      }
    };
  })
);
