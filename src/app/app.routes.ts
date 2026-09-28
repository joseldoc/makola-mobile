import { Routes } from '@angular/router';

import { compteActif, redirectionInitiale } from '@core/auth/guards';

export const routes: Routes = [
  {
    path: 'onboarding',
    loadChildren: () => import('./features/onboarding').then((m) => m.ONBOARDING_ROUTES)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth').then((m) => m.AUTH_ROUTES)
  },
  {
    path: 'classe',
    canActivate: [compteActif('prof')],
    loadChildren: () => import('./features/classe/classe-routes').then((m) => m.CLASSE_ROUTES)
  },
  {
    path: 'saisie',
    canActivate: [compteActif('prof')],
    loadChildren: () => import('./features/saisie/saisie-routes').then((m) => m.SAISIE_ROUTES)
  },
  {
    path: 'devoir',
    canActivate: [compteActif('prof')],
    loadChildren: () => import('./features/devoir/devoir-routes').then((m) => m.DEVOIR_ROUTES)
  },
  {
    path: 'fil-parent',
    canActivate: [compteActif('parent')],
    loadChildren: () => import('./features/fil-parent/fil-parent-routes').then((m) => m.FIL_PARENT_ROUTES)
  },
  // Chacun arrive là où son compte en est : présentation, connexion, profil ou écran d'accueil.
  { path: '', pathMatch: 'full', redirectTo: redirectionInitiale },
  { path: '**', redirectTo: redirectionInitiale }
];
