import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Country, CountryCode } from '@core/models/country';
import { RadioButtonComponent } from '@shared/forms/radio-button/radio-button';

import { CountrySheetActions } from '../../enums/country-sheet-actions.enum';

/** The single event of the sheet: a choice carries the chosen country. */
export type CountrySheetEvent =
  | { action: CountrySheetActions.Choose; country: CountryCode }
  | { action: CountrySheetActions.Close };

/**
 * Calling-code bottom sheet — ink scrim at 42 %, 16 top corners, tappable handle
 * (same build as the new-assignment sheet). A choice closes the sheet: there is
 * nothing to confirm.
 */
@Component({
  selector: 'app-country-sheet',
  imports: [RadioButtonComponent, TranslocoPipe],
  host: { '(document:keydown.escape)': 'sheetAction.emit({ action: CountrySheetActions.Close })' },
  template: `
    <div class="scrim" (click)="sheetAction.emit({ action: CountrySheetActions.Close })"></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="country-title">
      <button
        type="button"
        class="handle"
        [attr.aria-label]="'common.close' | transloco"
        (click)="sheetAction.emit({ action: CountrySheetActions.Close })"
      >
        <span></span>
      </button>
      <h2 class="title" id="country-title">{{ 'auth.country.title' | transloco }}</h2>
      <p class="text">{{ 'auth.country.text' | transloco }}</p>
      <div class="list" role="radiogroup" aria-labelledby="country-title">
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
    </section>
  `,
  styleUrl: './country-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountrySheetComponent {
  readonly countries = input.required<Country[]>();
  readonly selected = input.required<CountryCode>();
  /** One output for every action of the sheet — the page decides what each one does. */
  readonly sheetAction = output<CountrySheetEvent>();

  protected readonly CountrySheetActions = CountrySheetActions;
}
