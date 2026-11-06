import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { provideI18n } from '@core/i18n';
import { AuthApi } from '@core/services/auth-api';
import { MockAuthApi } from '@core/services/mock-auth-api';

import { CountrySheetComponent } from '../../components';
import { CountrySheetActions } from '../../enums/country-sheet-actions.enum';
import { AuthFlowStore } from '../../state/auth.store';
import { IdentifierPageComponent } from './identifier-page';

describe('IdentifierPageComponent — calling-code sheet', () => {
  let fixture: ComponentFixture<IdentifierPageComponent>;

  const element = () => fixture.nativeElement as HTMLElement;
  const sheet = () => fixture.debugElement.query(By.directive(CountrySheetComponent));
  const callingCode = () =>
    element().querySelector('app-phone-field .calling-code')!.textContent!.trim();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideI18n(),
        AuthFlowStore,
        { provide: AuthApi, useClass: MockAuthApi },
      ],
    });
    fixture = TestBed.createComponent(IdentifierPageComponent);
    fixture.componentRef.setInput('intent', 'sign-in');
    await fixture.whenStable();
    // The sheet opens from the calling code of the phone field.
    element().querySelector<HTMLButtonElement>('app-phone-field .calling-code')!.click();
    await fixture.whenStable();
    expect(sheet()).toBeTruthy();
  });

  it('Choose: sets the country and closes the sheet', async () => {
    expect(callingCode()).toContain('+242');

    sheet().componentInstance.sheetAction.emit({
      action: CountrySheetActions.Choose,
      country: 'KE',
    });
    await fixture.whenStable();

    expect(sheet()).toBeNull();
    expect(callingCode()).toContain('+254');
  });

  it('Close: closes the sheet and keeps the country', async () => {
    sheet().componentInstance.sheetAction.emit({ action: CountrySheetActions.Close });
    await fixture.whenStable();

    expect(sheet()).toBeNull();
    expect(callingCode()).toContain('+242');
  });
});
