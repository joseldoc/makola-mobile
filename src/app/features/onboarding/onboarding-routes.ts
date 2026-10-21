import { Routes } from '@angular/router';

import { guestOnly, onboardingNotSeen } from '@core/auth/guards';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: '',
    canActivate: [guestOnly, onboardingNotSeen],
    loadComponent: () => import('./pages').then((m) => m.OnboardingPageComponent)
  }
];
