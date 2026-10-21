import { SurfaceRole } from '@core/shared/roles';
import { IconName } from '@core/shared/icons';

/** One onboarding screen. No illustration: an icon from the set, a title, a text. */
export interface OnboardingSlide {
  role: SurfaceRole;
  icon: IconName;
  /** Translation root: `<key>.kicker`, `<key>.title`, `<key>.text`. */
  key: string;
}
