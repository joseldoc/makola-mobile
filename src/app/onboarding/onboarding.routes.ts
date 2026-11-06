import { Routes } from '@angular/router';

import { guestOnly } from '@core/guards/guest-only.guard';
import { onboardingNotSeen } from '@core/guards/onboarding-not-seen.guard';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: '',
    canActivate: [guestOnly, onboardingNotSeen],
    loadComponent: () =>
      import('./pages/onboarding-page/onboarding-page').then((m) => m.OnboardingPageComponent),
  },
];
