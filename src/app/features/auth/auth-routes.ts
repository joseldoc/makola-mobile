import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';

import { etapeProfil, visiteur } from '@core/auth/guards';

import { AuthFlowStore } from './auth.store';

/** L'écran de code n'a de sens qu'après une demande de code. */
const codeDemande: CanActivateFn = () =>
  inject(AuthFlowStore).identifiant() ? true : inject(Router).parseUrl('/auth');

/** Confirmation de l'enfant et numéro du parent : après un code d'invitation reconnu. */
const invitationReconnue: CanActivateFn = () =>
  inject(AuthFlowStore).invitation() ? true : inject(Router).parseUrl('/auth/invitation');

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    providers: [AuthFlowStore],
    children: [
      {
        path: '',
        canActivate: [visiteur],
        loadComponent: () => import('./pages').then((m) => m.AccueilPageComponent)
      },
      {
        path: 'inscription',
        canActivate: [visiteur],
        data: { intention: 'inscription' },
        loadComponent: () => import('./pages').then((m) => m.IdentifiantPageComponent)
      },
      {
        path: 'connexion',
        canActivate: [visiteur],
        data: { intention: 'connexion' },
        loadComponent: () => import('./pages').then((m) => m.IdentifiantPageComponent)
      },
      {
        path: 'invitation',
        canActivate: [visiteur],
        loadComponent: () => import('./pages').then((m) => m.InvitationPageComponent)
      },
      {
        path: 'invitation/enfant',
        canActivate: [visiteur, invitationReconnue],
        loadComponent: () => import('./pages').then((m) => m.EnfantPageComponent)
      },
      {
        path: 'invitation/numero',
        canActivate: [visiteur, invitationReconnue],
        data: { intention: 'invitation' },
        loadComponent: () => import('./pages').then((m) => m.IdentifiantPageComponent)
      },
      {
        path: 'code',
        canActivate: [visiteur, codeDemande],
        loadComponent: () => import('./pages').then((m) => m.CodePageComponent)
      },
      {
        path: 'profil',
        canActivate: [etapeProfil('prof')],
        loadComponent: () => import('./pages').then((m) => m.ProfilPageComponent)
      },
      {
        path: 'alertes',
        canActivate: [etapeProfil('parent')],
        loadComponent: () => import('./pages').then((m) => m.AlertesPageComponent)
      }
    ]
  }
];
