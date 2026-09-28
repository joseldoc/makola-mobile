import { inject } from '@angular/core';
import { CanActivateFn, RedirectFunction, Router } from '@angular/router';

import { SessionStore } from '@core/store/session/session.store';
import { Role } from './auth.model';

/** Route vide : chacun arrive là où son compte en est (présentation, connexion, profil, écran d'accueil). */
export const redirectionInitiale: RedirectFunction = () => {
  const session = inject(SessionStore);
  return inject(Router).parseUrl(session.routeInitiale());
};

/** Écrans de l'application : compte actif et bon rôle, sinon retour au point d'entrée. */
export function compteActif(role: Role): CanActivateFn {
  return () => {
    const session = inject(SessionStore);
    if (session.actif() && session.role() === role) return true;
    return inject(Router).parseUrl(session.routeInitiale());
  };
}

/** Présentation et connexion : réservées à qui n'a pas encore de compte actif. */
export const visiteur: CanActivateFn = () => {
  const session = inject(SessionStore);
  return session.actif() ? inject(Router).parseUrl(session.routeInitiale()) : true;
};

/** La présentation ne se rejoue pas une fois vue. */
export const onboardingAVoir: CanActivateFn = () => {
  const session = inject(SessionStore);
  return session.onboardingVu() ? inject(Router).parseUrl(session.routeInitiale()) : true;
};

/** Étape 2 (profil enseignant, alertes parent) : session ouverte mais compte pas encore actif. */
export function etapeProfil(role: Role): CanActivateFn {
  return () => {
    const session = inject(SessionStore);
    if (session.connecte() && !session.actif() && session.role() === role) return true;
    return inject(Router).parseUrl(session.routeInitiale());
  };
}
