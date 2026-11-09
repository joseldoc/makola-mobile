import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

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

describe('IdentifierPageComponent — invitation number, then consents or code (RI-20)', () => {
  let fixture: ComponentFixture<IdentifierPageComponent>;
  let store: InstanceType<typeof AuthFlowStore>;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let requestCode: ReturnType<typeof vi.spyOn>;

  /**
   * Lets the mock server answer (700 ms per call) and the view settle: Angular's
   * zoneless scheduler runs on timers too, so they advance while it waits.
   */
  async function settle(): Promise<void> {
    const stable = fixture.whenStable();
    await vi.runAllTimersAsync();
    await stable;
  }

  /** The parent types the national number on a physical keyboard, then Enter. */
  async function enterNumber(digits: string): Promise<void> {
    for (const key of digits) document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    await settle();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await settle();
  }

  async function open(invitationCode: string): Promise<void> {
    vi.useFakeTimers();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideI18n(),
        AuthFlowStore,
        { provide: AuthApi, useClass: MockAuthApi },
      ],
    });
    navigateByUrl = vi.fn().mockResolvedValue(true);
    TestBed.inject(Router).navigateByUrl = navigateByUrl as unknown as Router['navigateByUrl'];
    requestCode = vi.spyOn(TestBed.inject(AuthApi), 'requestCode');
    store = TestBed.inject(AuthFlowStore);
    const recognised = store.checkInvitation(invitationCode);
    await vi.runAllTimersAsync();
    expect(await recognised).toBe(true);
    fixture = TestBed.createComponent(IdentifierPageComponent);
    fixture.componentRef.setInput('intent', 'invitation');
    await settle();
  }

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('Congolese invitation, Congolese number: straight to the code — the consent screen is never on the way', async () => {
    await open('482913');

    await enterNumber('066123456');

    expect(navigateByUrl.mock.calls).toEqual([['/auth/code']]);
    expect(requestCode).toHaveBeenCalledOnce();
    expect(store.requiredConsents()).toEqual([]);
  });

  it('Kenyan invitation: the consents come first, and no SMS leaves before them', async () => {
    await open('730615');

    await enterNumber('066123456');

    expect(navigateByUrl.mock.calls).toEqual([['/auth/invitation/consents']]);
    expect(requestCode).not.toHaveBeenCalled();
    expect(store.requiredConsents()).toEqual(['CHILD_DATA', 'CROSS_BORDER_TRANSFER']);
  });
});

describe('IdentifierPageComponent — joining while signed in: the account’s contact entered (A-23)', () => {
  async function open(identifier: { channel: 'phone' | 'email'; value: string }) {
    localStorage.clear();
    localStorage.setItem(
      'mk.session',
      JSON.stringify({ id: 'a1', identifier, activeRole: 'parent', roles: { parent: 'ready' } }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideI18n(),
        AuthFlowStore,
        { provide: AuthApi, useClass: MockAuthApi },
      ],
    });
    TestBed.inject(AuthFlowStore).join();
    const fixture = TestBed.createComponent(IdentifierPageComponent);
    fixture.componentRef.setInput('intent', 'invitation');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => localStorage.clear());

  it('a Kenyan number: its calling code and its digits', async () => {
    const element = await open({ channel: 'phone', value: '+254712345678' });

    const field = element.querySelector('app-phone-field')!.textContent!.replace(/\s/g, '');
    expect(field).toContain('+254');
    expect(field).toContain('712345678');
  });

  it('another number sent right after its last digit: the refusal stays on screen', async () => {
    const element = await open({ channel: 'phone', value: '+242066123456' });
    vi.useFakeTimers();
    try {
      const send = vi.spyOn(TestBed.inject(AuthApi), 'requestCode');

      // Erase, type and send in one go: the last keystroke's effect runs after the refusal.
      for (let i = 0; i < 9; i++)
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
      for (const key of '055123456Enter'.match(/\d|Enter/g)!)
        document.dispatchEvent(new KeyboardEvent('keydown', { key }));
      await vi.runAllTimersAsync();

      const hint = element.querySelector('.hint')!.textContent!.replace(/\u00a0/g, ' ');
      expect(hint).toContain('This phone is signed in with +242 06 612 34 56');
      expect(send).not.toHaveBeenCalled();

      // A new input clears it.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
      await vi.runAllTimersAsync();
      expect(element.querySelector('.hint')!.textContent).not.toContain('signed in with');
    } finally {
      vi.useRealTimers();
    }
  });

  it('an email account: the email field, filled', async () => {
    const element = await open({ channel: 'email', value: 'aline.mbemba@example.cg' });

    expect(element.querySelector('app-phone-field')).toBeNull();
    expect(element.querySelector<HTMLInputElement>('app-text-field input')!.value).toBe(
      'aline.mbemba@example.cg',
    );
  });
});
