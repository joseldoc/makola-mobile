import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { TonalHeaderComponent } from '@core/shared/components/data/tonal-header/tonal-header';
import { IconComponent } from '@core/shared/components/foundation/icon/icon';

import { OnboardingSlide } from '../../model';

/**
 * One onboarding screen: full-bleed tonal header in the tint of the role
 * concerned, an icon from the set in a white disc, a title, a text.
 * No illustration — the @makola rule also holds for the entry.
 */
@Component({
  selector: 'app-onboarding-slide',
  imports: [TonalHeaderComponent, IconComponent, TranslocoPipe],
  template: `
    <article class="slide" role="group" [attr.aria-roledescription]="'onboarding.screen' | transloco" [attr.aria-label]="position()">
      <app-tonal-header [role]="slide().role" [fullBleed]="true">
        <div class="visual">
          <div class="disc">
            <app-icon [name]="slide().icon" [size]="36" />
          </div>
        </div>
      </app-tonal-header>
      <div class="body">
        <p class="kicker">{{ slide().key + '.kicker' | transloco }}</p>
        <h2 class="title">{{ slide().key + '.title' | transloco }}</h2>
        <p class="text">{{ slide().key + '.text' | transloco }}</p>
      </div>
    </article>
  `,
  styleUrl: './onboarding-slide.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingSlideComponent {
  readonly slide = input.required<OnboardingSlide>();
  /** "2 of 4" — read by screen readers. Already translated. */
  readonly position = input('');
}
