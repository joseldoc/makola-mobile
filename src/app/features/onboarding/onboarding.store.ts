import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { ICONS } from '@core/shared/icons';
import { OnboardingSlide } from './model';

/**
 * Four screens, no more: what the tool does, what it guarantees, and the limits
 * it states instead of hiding them (@makola voice: plain, factual, "you").
 */
const SLIDES: OnboardingSlide[] = [
  { role: 'teacher', icon: ICONS.classroom, key: 'onboarding.slides.classrooms' },
  { role: 'teacher', icon: ICONS.offline, key: 'onboarding.slides.offline' },
  { role: 'parent', icon: ICONS.progress, key: 'onboarding.slides.parents' },
  { role: 'school', icon: ICONS.document, key: 'onboarding.slides.reportCards' }
];

export const OnboardingStore = signalStore(
  withState({ slides: SLIDES, index: 0 }),
  withComputed(({ slides, index }) => ({
    last: computed(() => index() === slides().length - 1),
    current: computed(() => slides()[index()])
  })),
  withMethods((store) => ({
    setIndex(index: number): void {
      const bounded = Math.max(0, Math.min(index, store.slides().length - 1));
      if (bounded !== store.index()) patchState(store, { index: bounded });
    }
  }))
);
