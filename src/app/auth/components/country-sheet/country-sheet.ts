import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Country, CountryCode } from '@core/models/country';
import { RadioButtonComponent } from '@shared/forms/radio-button/radio-button';
import { BottomSheetComponent } from '@shared/navigation/bottom-sheet/bottom-sheet';

import { CountrySheetActions } from '../../enums/country-sheet-actions.enum';

/** The single event of the sheet: a choice carries the chosen country. */
export type CountrySheetEvent =
  | { action: CountrySheetActions.Choose; country: CountryCode }
  | { action: CountrySheetActions.Close };

/**
 * Calling-code bottom sheet, on `app-bottom-sheet` (scrim, handle, Escape — the
 * form this sheet had on its own until 8 November 2026). A choice closes the
 * sheet: there is nothing to confirm.
 */
@Component({
  selector: 'app-country-sheet',
  imports: [BottomSheetComponent, RadioButtonComponent, TranslocoPipe],
  template: `
    <app-bottom-sheet
      [title]="'auth.country.title' | transloco"
      [text]="'auth.country.text' | transloco"
      (closed)="sheetAction.emit({ action: CountrySheetActions.Close })"
    >
      <div role="radiogroup" [attr.aria-label]="'auth.country.title' | transloco">
        @for (c of countries(); track c.code) {
          <app-radio-button
            [label]="'countries.' + c.code | transloco"
            [sublabel]="
              'auth.country.digits' | transloco: { code: c.callingCode, length: c.length }
            "
            [selected]="c.code === selected()"
            (select)="sheetAction.emit({ action: CountrySheetActions.Choose, country: c.code })"
          />
        }
      </div>
    </app-bottom-sheet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountrySheetComponent {
  readonly countries = input.required<Country[]>();
  readonly selected = input.required<CountryCode>();
  /** One output for every action of the sheet — the page decides what each one does. */
  readonly sheetAction = output<CountrySheetEvent>();

  protected readonly CountrySheetActions = CountrySheetActions;
}
