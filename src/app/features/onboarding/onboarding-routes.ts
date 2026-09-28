import { Routes } from '@angular/router';

import { onboardingAVoir, visiteur } from '@core/auth/guards';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: '',
    canActivate: [visiteur, onboardingAVoir],
    loadComponent: () => import('./pages').then((m) => m.OnboardingPageComponent)
  }
];
