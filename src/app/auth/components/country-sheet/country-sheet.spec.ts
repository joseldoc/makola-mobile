import { TestBed } from '@angular/core/testing';

import { provideI18n } from '@core/i18n';
import { COUNTRIES } from '@core/models/country';

import { CountrySheetActions } from '../../enums/country-sheet-actions.enum';
import { CountrySheetComponent, CountrySheetEvent } from './country-sheet';

describe('CountrySheetComponent', () => {
  async function setup() {
    TestBed.configureTestingModule({ providers: [provideI18n()] });
    const fixture = TestBed.createComponent(CountrySheetComponent);
    fixture.componentRef.setInput('countries', COUNTRIES);
    fixture.componentRef.setInput('selected', 'CG');
    const events: CountrySheetEvent[] = [];
    fixture.componentInstance.sheetAction.subscribe((event) => events.push(event));
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement, events };
  }

  it('emits Choose with the picked country', async () => {
    const { element, events } = await setup();
    const radios = element.querySelectorAll<HTMLElement>('app-radio-button .radio');
    const kenya = COUNTRIES.findIndex((c) => c.code === 'KE');

    radios[kenya].click();

    expect(events).toEqual([{ action: CountrySheetActions.Choose, country: 'KE' }]);
  });

  it('emits Close from the scrim, the handle and Escape — never a Choose', async () => {
    const { element, events } = await setup();

    element.querySelector<HTMLElement>('.scrim')!.click();
    element.querySelector<HTMLElement>('.handle')!.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    const close = { action: CountrySheetActions.Close };
    expect(events).toEqual([close, close, close]);
  });
});
