import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { provideI18n } from '@core/i18n';
import { Session } from '@core/models/auth.model';
import { AuthApi } from '@core/services/auth-api';
import { MockAuthApi } from '@core/services/mock-auth-api';
import { SessionStore } from '@core/store/session/session.store';

import { routes } from '../app.routes';

/**
 * Account flows decided on 8 November 2026, through the real router, the real
 * screens and the mock server: A-23 (joining an invitation while signed in),
 * A-21 (a parent who signs up as a teacher), and the guest flow left as it was.
 */
const congolese = '+242066123456';
const teacher: Session = {
  id: 'a1',
  identifier: { channel: 'phone', value: congolese },
  name: 'NKOUKA Joseph',
  activeRole: 'teacher',
  roles: { teacher: 'ready' },
};

let harness: RouterTestingHarness;

/** What the phone holds before the app starts: the mock's accounts, and a session. */
function seed(accounts: Session[], session?: Session): void {
  localStorage.clear();
  localStorage.setItem('mk.onboarding-seen', 'true');
  localStorage.setItem(
    'mk.mock.accounts',
    JSON.stringify(Object.fromEntries(accounts.map((a) => [`phone:${a.identifier.value}`, a]))),
  );
  if (session) localStorage.setItem('mk.session', JSON.stringify(session));
}

async function start(url: string): Promise<void> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      provideI18n(),
      { provide: AuthApi, useClass: MockAuthApi },
    ],
  });
  harness = await RouterTestingHarness.create();
  await go(url);
}

/** The mock answers after 700 ms; time runs on, and can be pushed forward. */
async function settle(): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await vi.advanceTimersByTimeAsync(400);
    await harness.fixture.whenStable();
  }
}

async function go(url: string): Promise<void> {
  void harness.navigateByUrl(url);
  await settle();
}

const url = () => TestBed.inject(Router).url;
/** The number shown in the phone field, without its grouping spaces. */
const phoneDigits = () =>
  screen().querySelector('app-phone-field')!.textContent!.replace(/\s/g, '');
const screen = () => harness.routeNativeElement!;
const session = () => TestBed.inject(SessionStore);

/** Digits and keys typed on a physical keyboard: every entry screen listens to it. */
async function type(keys: string): Promise<void> {
  for (const key of keys) document.dispatchEvent(new KeyboardEvent('keydown', { key }));
  await settle();
}

async function press(key: string): Promise<void> {
  document.dispatchEvent(new KeyboardEvent('keydown', { key }));
  await settle();
}

async function footer(): Promise<void> {
  screen().querySelector<HTMLButtonElement>('app-footer-action button')!.click();
  await settle();
}

describe('Account flows (8 November 2026)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('A-23 — a teacher joins an invitation without signing out', () => {
    it('from the account sheet’s entry to the parent feed: same account, both spaces ready', async () => {
      seed([teacher], teacher);
      await start('/auth/join');
      expect(url()).toBe('/auth/invitation');

      await type('482913');
      expect(url()).toBe('/auth/invitation/child');
      await footer();
      expect(url()).toBe('/auth/invitation/phone');

      // The account's own number is already entered.
      expect(phoneDigits()).toContain('066123456');
      await press('Enter');
      // Congo: no consent asked — straight to the code.
      expect(url()).toBe('/auth/code');

      await type('123456');
      expect(url()).toBe('/auth/alerts');
      // The alerts are set for this child.
      expect(screen().textContent).toContain('Marie');
      await footer();

      expect(url()).toBe('/parent-feed');
      expect(session().session()).toMatchObject({
        id: 'a1',
        name: 'NKOUKA Joseph',
        activeRole: 'parent',
        roles: { teacher: 'ready', parent: 'ready' },
      });
    });

    it('Kenyan invitation: the same consent screen, before any code (RM-20)', async () => {
      seed([teacher], teacher);
      await start('/auth/join');

      await type('730615');
      await footer();
      await press('Enter');
      expect(url()).toBe('/auth/invitation/consents');

      for (const box of Array.from(
        screen().querySelectorAll<HTMLElement>('app-checkbox [role="checkbox"]'),
      )) {
        box.click();
      }
      await settle();
      await footer();
      expect(url()).toBe('/auth/code');

      await type('123456');
      expect(url()).toBe('/auth/alerts');
      expect(session().session()?.id).toBe('a1');
    });

    it('another number is refused on the spot, with what to do — no code leaves', async () => {
      seed([teacher], teacher);
      await start('/auth/join');
      await type('482913');
      await footer();
      const requestCode = vi.spyOn(TestBed.inject(AuthApi), 'requestCode');

      for (let i = 0; i < 9; i++) await press('Backspace');
      await type('055123456');
      await press('Enter');

      expect(url()).toBe('/auth/invitation/phone');
      expect(requestCode).not.toHaveBeenCalled();
      const hint = screen().querySelector('.hint')!.textContent!.replace(/ /g, ' ');
      expect(hint).toContain('This phone is signed in with +242 06 612 34 56');
      expect(hint).toContain('sign out, then enter the code again from the welcome screen');
      expect(session().session()?.id).toBe('a1');
    });

    it('going back from the first screen returns to the space it came from', async () => {
      seed([teacher], teacher);
      await start('/auth/join');

      screen().querySelector<HTMLButtonElement>('app-auth-banner app-bar-target button')!.click();
      await settle();

      expect(url()).toBe('/classroom');
      expect(session().activeRole()).toBe('teacher');
    });

    it('the invitation screens stay closed to a signed-in account that did not come through the entry', async () => {
      seed([teacher], teacher);
      await start('/auth/invitation');

      expect(url()).toBe('/classroom');
    });
  });

  describe('the guest flow is unchanged', () => {
    it('a new parent: nothing entered for them, a parent account at the end', async () => {
      seed([]);
      await start('/auth/invitation');

      await type('482913');
      await footer();
      expect(phoneDigits()).not.toContain('066');
      await type('055123456');
      await press('Enter');
      await type('123456');
      expect(url()).toBe('/auth/alerts');
      await footer();

      expect(url()).toBe('/parent-feed');
      expect(session().session()?.roles).toEqual({ parent: 'ready' });
    });
  });

  describe('A-21 — a parent signs up as a teacher with their number', () => {
    const parent: Session = {
      id: 'p1',
      identifier: { channel: 'phone', value: congolese },
      activeRole: 'parent',
      roles: { parent: 'ready' },
    };

    it('keeps the account: the teacher profile comes next, and says the parent space stays', async () => {
      seed([parent]);
      await start('/auth/sign-up');

      await type('066123456');
      await press('Enter');
      expect(url()).toBe('/auth/code');
      await type('123456');

      expect(url()).toBe('/auth/profile');
      expect(session().session()).toMatchObject({
        id: 'p1',
        activeRole: 'teacher',
        roles: { parent: 'ready', teacher: 'setup' },
      });
      expect(screen().textContent).toContain('Your account already has a parent space');
    });

    it('a new teacher: the profile says nothing of a parent space', async () => {
      seed([]);
      await start('/auth/sign-up');

      await type('066123456');
      await press('Enter');
      await type('123456');

      expect(url()).toBe('/auth/profile');
      expect(session().session()?.roles).toEqual({ teacher: 'setup' });
      expect(screen().textContent).not.toContain('parent space');
    });

    it('a teacher signing up again is told to sign in', async () => {
      seed([teacher]);
      await start('/auth/sign-up');

      await type('066123456');
      await press('Enter');

      expect(url()).toBe('/auth/sign-up');
      expect(screen().querySelector('.hint')!.textContent).toContain('Sign in with it instead');
    });
  });
});
