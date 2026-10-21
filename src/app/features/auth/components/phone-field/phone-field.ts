import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Country, formatNational } from '@core/auth/country';
import { IconComponent } from '@core/shared/components/foundation/icon/icon';

/**
 * Phone field of the entry (mock-up 24c): digits typed on the dedicated keypad —
 * the system keyboard never opens. The calling code is tappable: it sets the
 * country, which is never asked again. Same notch as the M3 outlined field.
 */
@Component({
  selector: 'app-phone-field',
  imports: [IconComponent, TranslocoPipe],
  template: `
    <div class="field" [class.error]="error()" [class.active]="!error()" role="group" [attr.aria-label]="'auth.phone.label' | transloco">
      <span class="label">{{ 'auth.phone.label' | transloco }}</span>
      <button
        type="button"
        class="calling-code"
        [attr.aria-label]="
          'auth.phone.changeCountry' | transloco: { code: country().callingCode, country: ('countries.' + country().code | transloco) }
        "
        (click)="changeCountry.emit()"
      >
        +{{ country().callingCode }}
        <app-icon name="chevron-down-outline" [size]="16" />
      </button>
      <span class="value" aria-live="polite">
        {{ display() }}<span class="caret" aria-hidden="true"></span>
      </span>
    </div>
  `,
  styleUrl: './phone-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhoneFieldComponent {
  readonly country = input.required<Country>();
  /** Digits typed after the calling code, without spaces (« 066123 »). */
  readonly digits = input.required<string>();
  readonly error = input(false);
  readonly changeCountry = output<void>();

  protected readonly display = computed(() => formatNational(this.country(), this.digits()));
}
