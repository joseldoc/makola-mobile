import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { provideI18n } from '@core/i18n';
import { Identifier, Invitation, ParentalConsent } from '@core/models/auth.model';
import { AuthApi } from '@core/services/auth-api';
import { LanguageStore } from '@core/store/language/language.store';

import { AuthFlowStore } from '../../state/auth.store';
import { ConsentsPageComponent } from './consents-page';

const kenyan: Identifier = { channel: 'phone', value: '+254712345678' };
const invitation: Invitation = {
  code: '730615',
  student: 'KAMAU Wanjiru',
  classroom: 'Form 2 East',
  school: 'Baobab Hill Secondary School',
  teacher: 'Ms ODHIAMBO',
  subject: 'Mathematics',
};

describe('ConsentsPageComponent — Kenyan parental consents (RI-20)', () => {
  let fixture: ComponentFixture<ConsentsPageComponent>;
  let store: InstanceType<typeof AuthFlowStore>;
  let api: { requestCode: ReturnType<typeof vi.fn> };
  let navigateByUrl: ReturnType<typeof vi.fn>;

  async function open(required: ParentalConsent[]): Promise<void> {
    localStorage.clear();
    api = { requestCode: vi.fn().mockResolvedValue({ resendIn: 45 }) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideI18n(),
        AuthFlowStore,
        {
          provide: AuthApi,
          useValue: {
            ...api,
            checkInvitation: vi.fn().mockResolvedValue(invitation),
            requiredConsents: vi.fn().mockResolvedValue(required),
          },
        },
      ],
    });
    navigateByUrl = vi.fn().mockResolvedValue(true);
    TestBed.inject(Router).navigateByUrl = navigateByUrl as unknown as Router['navigateByUrl'];
    // The flow as it comes here: invitation recognised, number entered, consents asked.
    store = TestBed.inject(AuthFlowStore);
    await store.checkInvitation('730615');
    await store.submitContact(kenyan);
    fixture = TestBed.createComponent(ConsentsPageComponent);
    await fixture.whenStable();
  }

  const element = () => fixture.nativeElement as HTMLElement;
  const boxes = () => Array.from(element().querySelectorAll<HTMLElement>('[role="checkbox"]'));
  const footerButton = () =>
    element().querySelector<HTMLButtonElement>('app-footer-action button')!;
  const declineButton = () =>
    element().querySelector<HTMLButtonElement>('app-outlined-button button')!;
  const tick = async (box: HTMLElement) => {
    box.click();
    await fixture.whenStable();
  };
  const press = async (button: HTMLButtonElement) => {
    button.click();
    await fixture.whenStable();
  };

  afterEach(() => localStorage.clear());

  it('shows one box per document, none ticked, each naming the child', async () => {
    await open(['CHILD_DATA', 'CROSS_BORDER_TRANSFER']);

    expect(boxes().map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'false']);
    expect(boxes()[0].textContent).toContain("Wanjiru's school data");
    expect(boxes()[1].textContent).toContain('Storage outside Kenya');
    expect(boxes()[1].textContent).toContain('in Europe, outside Kenya');
    expect(element().textContent).toContain('You can withdraw each consent later');
  });

  it('shows only the documents asked', async () => {
    await open(['CROSS_BORDER_TRANSFER']);

    expect(boxes().length).toBe(1);
    expect(footerButton().textContent!.trim()).toBe('Boxes left to tick: 1');
  });

  it('the button is never greyed out: it says what is left, and a press goes no further', async () => {
    await open(['CHILD_DATA', 'CROSS_BORDER_TRANSFER']);

    expect(footerButton().disabled).toBe(false);
    expect(footerButton().textContent!.trim()).toBe('Boxes left to tick: 2');

    await tick(boxes()[0]);
    expect(footerButton().textContent!.trim()).toBe('Boxes left to tick: 1');

    await press(footerButton());
    expect(api.requestCode).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
    // The box still to tick takes the focus.
    expect(document.activeElement).toBe(boxes()[1]);
  });

  it('continues once every box is ticked: the code is sent, the consents kept for the acceptance', async () => {
    await open(['CHILD_DATA', 'CROSS_BORDER_TRANSFER']);

    await tick(boxes()[0]);
    await tick(boxes()[1]);
    expect(footerButton().textContent!.trim()).toBe('Get the code');

    await press(footerButton());
    expect(api.requestCode).toHaveBeenCalledWith(kenyan, 'invitation');
    expect(store.givenConsents()).toEqual(['CHILD_DATA', 'CROSS_BORDER_TRANSFER']);
    expect(navigateByUrl).toHaveBeenCalledWith('/auth/code');
  });

  it('unticking takes the consent back', async () => {
    await open(['CHILD_DATA', 'CROSS_BORDER_TRANSFER']);

    await tick(boxes()[0]);
    await tick(boxes()[1]);
    await tick(boxes()[1]);

    expect(footerButton().textContent!.trim()).toBe('Boxes left to tick: 1');
  });

  it('a parent who does not consent leaves: no link, no code, the reason said on the invitation screen', async () => {
    await open(['CHILD_DATA', 'CROSS_BORDER_TRANSFER']);

    await press(declineButton());

    expect(api.requestCode).not.toHaveBeenCalled();
    expect(store.invitation()).toBeNull();
    expect(store.error()).toBe('consents-declined');
    expect(navigateByUrl).toHaveBeenCalledWith('/auth/invitation');
  });

  it('speaks French', async () => {
    await open(['CHILD_DATA', 'CROSS_BORDER_TRANSFER']);
    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();

    // Non-breaking space before the colon (French typography, i18n-source.py).
    expect(footerButton().textContent!.trim()).toBe('Cases restantes à cocher\u00a0: 2');
    expect(boxes()[0].textContent).toContain('Données scolaires de Wanjiru');
    expect(boxes()[1].textContent).toContain('hébergés en Europe, hors du Kenya');
    expect(declineButton().textContent!.trim()).toBe('Je ne consens pas');
  });
});
