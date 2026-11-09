import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { APPEARANCES, Appearance } from '@core/models/appearance';

/**
 * Appearance pill (dark mode, 9 November 2026) — System, Light, Dark: the same
 * segmented control as `app-language-switch`, placed beside it (account sheet,
 * welcome, onboarding). « System » follows the phone's setting and is the default.
 * Presentation only, one natural event: the container calls `ThemeStore.setAppearance`.
 *
 * Source: none in the design system — the form of `app-language-switch`, whose
 * styles it shares (`../_segmented.scss`). Text labels, not icons: the icon set
 * has no sun nor moon, and adding one is a design system decision.
 */
@Component({
  selector: 'app-appearance-switch',
  imports: [TranslocoPipe],
  template: `
    <div class="switch" role="radiogroup" [attr.aria-label]="'appearance.label' | transloco">
      @for (appearance of appearances; track appearance) {
        <button
          type="button"
          class="option"
          role="radio"
          [class.active]="appearance === value()"
          [attr.aria-checked]="appearance === value()"
          [attr.data-appearance]="appearance"
          (click)="appearance !== value() && valueChange.emit(appearance)"
        >
          {{ 'appearance.' + appearance | transloco }}
        </button>
      }
    </div>
  `,
  styleUrl: './appearance-switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceSwitchComponent {
  readonly value = input.required<Appearance>();
  readonly valueChange = output<Appearance>();

  protected readonly appearances = APPEARANCES;
}
