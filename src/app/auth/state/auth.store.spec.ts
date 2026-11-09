import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { Identifier, Invitation, ParentalConsent } from '@core/models/auth.model';
import { formatIdentifier } from '@core/models/identifier';
import { AuthApi } from '@core/services/auth-api';
import { SessionStore } from '@core/store/session/session.store';

import { consentsRequired, guestOrJoining, joinEntry } from '../auth.routes';
import { AuthFlowStore } from './auth.store';

const BOTH: ParentalConsent[] = ['CHILD_DATA', 'CROSS_BORDER_TRANSFER'];
const kenyan: Identifier = { channel: 'phone', value: '+254712345678' };
const congolese: Identifier = { channel: 'phone', value: '+242066123456' };
const invitation: Invitation = {
  code: '730615',
  student: 'KAMAU Wanjiru',
  classroom: 'Form 2 East',
  school: 'Baobab Hill Secondary School',
  teacher: 'Ms ODHIAMBO',
  subject: 'Mathematics',
};

/** The server, simulated: it alone says which consents the acceptance asks for. */
function stubApi(required: ParentalConsent[]) {
  return {
    checkInvitation: vi.fn().mockResolvedValue(invitation),
    requiredConsents: vi.fn().mockResolvedValue(required),
    requestCode: vi.fn().mockResolvedValue({ resendIn: 45 }),
    verifyCode: vi.fn().mockResolvedValue({
      id: 'a1',
      identifier: kenyan,
      activeRole: 'parent',
      roles: { parent: 'setup' },
    }),
    completeProfile: vi.fn(),
    saveAlerts: vi.fn(),
  };
}

function setup(required: ParentalConsent[]) {
  localStorage.clear();
  const api = stubApi(required);
  TestBed.configureTestingModule({
    providers: [provideRouter([]), AuthFlowStore, { provide: AuthApi, useValue: api }],
  });
  return { api, store: TestBed.inject(AuthFlowStore) };
}

describe('AuthFlowStore — parental consents in the invitation flow (RI-20)', () => {
  afterEach(() => localStorage.clear());

  it('the server asks for consents: they come next, and no code leaves before them', async () => {
    const { api, store } = setup(BOTH);
    await store.checkInvitation('730615');

    expect(await store.submitContact(kenyan)).toBe('consents');

    expect(api.requiredConsents).toHaveBeenCalledWith(kenyan, invitation);
    expect(api.requestCode).not.toHaveBeenCalled();
    expect(store.requiredConsents()).toEqual(BOTH);
  });

  it('the server asks for none: straight to the code', async () => {
    const { api, store } = setup([]);
    await store.checkInvitation('482913');

    expect(await store.submitContact(congolese)).toBe('code');

    expect(api.requestCode).toHaveBeenCalledOnce();
    expect(store.requiredConsents()).toEqual([]);
  });

  it('a sign-in never asks the server about consents', async () => {
    const { api, store } = setup(BOTH);
    store.start('sign-in');

    expect(await store.submitContact(congolese)).toBe('code');
    expect(api.requiredConsents).not.toHaveBeenCalled();
  });

  it('the consents given go with the acceptance', async () => {
    const { api, store } = setup(BOTH);
    await store.checkInvitation('730615');
    await store.submitContact(kenyan);

    expect(await store.giveConsents(BOTH)).toBe(true);
    expect(api.requestCode).toHaveBeenCalledWith(kenyan, 'invitation');

    await store.verifyCode('123456');
    expect(api.verifyCode).toHaveBeenCalledWith(kenyan, '123456', 'invitation', {
      invitation,
      consents: BOTH,
    });
  });

  it('forgets them on a new number, a new invitation, or a decline', async () => {
    const { api, store } = setup(BOTH);
    await store.checkInvitation('730615');
    await store.submitContact(kenyan);
    await store.giveConsents(BOTH);

    // Another number: asked again, nothing given.
    api.requiredConsents.mockResolvedValue(['CROSS_BORDER_TRANSFER']);
    await store.submitContact(congolese);
    expect(store.requiredConsents()).toEqual(['CROSS_BORDER_TRANSFER']);
    expect(store.givenConsents()).toEqual([]);

    await store.checkInvitation('730615');
    expect(store.requiredConsents()).toBeNull();

    await store.submitContact(kenyan);
    store.declineInvitation('consents-declined');
    expect(store.invitation()).toBeNull();
    expect(store.requiredConsents()).toBeNull();
    expect(store.error()).toBe('consents-declined');
  });
});

describe('consentsRequired — the consent screen’s guard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  const guard = () => {
    const result = TestBed.runInInjectionContext(() => consentsRequired(route, state));
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result;
  };

  afterEach(() => localStorage.clear());

  it('opens once the server has asked for consents for this number', async () => {
    const { store } = setup(BOTH);
    await store.checkInvitation('730615');
    await store.submitContact(kenyan);

    expect(guard()).toBe(true);
  });

  it('sends back to the number when the server asked for none — the screen never shows', async () => {
    const { store } = setup([]);
    await store.checkInvitation('482913');
    await store.submitContact(congolese);

    expect(guard()).toBe('/auth/invitation/phone');
  });

  it('sends back to the number before the server has answered', async () => {
    const { store } = setup(BOTH);
    await store.checkInvitation('730615');

    expect(guard()).toBe('/auth/invitation/phone');
  });
});

describe('AuthFlowStore — joining an invitation while signed in (A-23, 8 November 2026)', () => {
  const account = {
    id: 'a1',
    identifier: congolese,
    name: 'NKOUKA Joseph',
    activeRole: 'teacher',
    roles: { teacher: 'ready' },
  } as const;

  /** A teacher signed in on this phone; the server simulated. */
  function signedIn(required: ParentalConsent[] = []) {
    localStorage.clear();
    localStorage.setItem('mk.session', JSON.stringify(account));
    const api = stubApi(required);
    api.verifyCode.mockResolvedValue({
      ...account,
      activeRole: 'parent',
      roles: { teacher: 'ready', parent: 'setup' },
    });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), AuthFlowStore, { provide: AuthApi, useValue: api }],
    });
    return { api, store: TestBed.inject(AuthFlowStore), session: TestBed.inject(SessionStore) };
  }

  afterEach(() => localStorage.clear());

  it('join() starts the flow again for the account: what an earlier visit left is forgotten', async () => {
    const { store } = signedIn();
    await store.checkInvitation('482913');
    store.declineInvitation('consents-declined');

    store.join();

    expect(store.joining()).toBe(true);
    expect(store.intent()).toBe('invitation');
    expect(store.invitation()).toBeNull();
    expect(store.error()).toBeNull();
    expect(store.joiningContact()).toEqual(congolese);
  });

  it('another contact is refused before any call — no SMS — and the message says what to do', async () => {
    const { api, store } = signedIn();
    store.join();
    await store.checkInvitation('482913');

    expect(await store.submitContact(kenyan)).toBeNull();

    expect(api.requiredConsents).not.toHaveBeenCalled();
    expect(api.requestCode).not.toHaveBeenCalled();
    expect(store.error()).toBe('other-account');
    expect(store.errorMessage()).toEqual({
      key: 'auth.errors.other-account',
      params: {
        identifier: formatIdentifier(kenyan),
        channel: 'phone',
        account: formatIdentifier(congolese),
      },
    });
  });

  it('the account’s own contact goes on — through the consents when the server asks for some', async () => {
    const { api, store } = signedIn(BOTH);
    store.join();
    await store.checkInvitation('730615');

    expect(await store.submitContact(congolese)).toBe('consents');
    expect(api.requiredConsents).toHaveBeenCalledWith(congolese, invitation);
    expect(await store.giveConsents(BOTH)).toBe(true);
    expect(api.requestCode).toHaveBeenCalledWith(congolese, 'invitation');
  });

  it('the acceptance opens the parent space of the same account, and ends the join', async () => {
    const { api, store, session } = signedIn();
    store.join();
    await store.checkInvitation('482913');
    await store.submitContact(congolese);

    await store.verifyCode('123456');

    expect(api.verifyCode).toHaveBeenCalledWith(congolese, '123456', 'invitation', {
      invitation,
      consents: [],
    });
    expect(session.session()?.id).toBe('a1');
    expect(session.activeRole()).toBe('parent');
    expect(session.initialRoute()).toBe('/auth/alerts');
    expect(store.joining()).toBe(false);
  });

  it('leaveJoin() forgets the join: the account goes back to the space it came from', async () => {
    const { store, session } = signedIn();
    store.join();
    await store.checkInvitation('482913');

    store.leaveJoin();

    expect(store.joining()).toBe(false);
    expect(store.invitation()).toBeNull();
    expect(session.initialRoute()).toBe('/classroom');
  });

  it('signed out, a join left behind checks nothing: the guest flow is the usual one', async () => {
    const { api, store, session } = signedIn();
    store.join();
    session.close();
    await store.checkInvitation('482913');

    expect(store.joiningContact()).toBeNull();
    expect(await store.submitContact(kenyan)).toBe('code');
    expect(api.requestCode).toHaveBeenCalledWith(kenyan, 'invitation');
  });

  it('a sign-in or a sign-up from the welcome screen never joins', () => {
    const { store } = signedIn();
    store.join();

    store.start('sign-in');

    expect(store.joining()).toBe(false);
  });
});

describe('AuthFlowStore — the space a sign-in opens (A-22)', () => {
  const both = {
    id: 'a1',
    identifier: congolese,
    activeRole: 'teacher',
    roles: { teacher: 'ready', parent: 'ready' },
  } as const;

  function setupWith(lastUsed: 'teacher' | 'parent') {
    localStorage.clear();
    localStorage.setItem('mk.last-space', JSON.stringify({ a1: lastUsed }));
    const api = stubApi([]);
    api.verifyCode.mockResolvedValue(both);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), AuthFlowStore, { provide: AuthApi, useValue: api }],
    });
    return { store: TestBed.inject(AuthFlowStore), session: TestBed.inject(SessionStore) };
  }

  afterEach(() => localStorage.clear());

  it('a sign-in reopens the last space used here, not the one the server sent', async () => {
    const { store, session } = setupWith('parent');
    store.start('sign-in');
    await store.submitContact(congolese);

    await store.verifyCode('123456');

    expect(session.activeRole()).toBe('parent');
  });

  it('a sign-up opens the space it leads to (A-21: the teacher profile), whatever was used', async () => {
    const { store, session } = setupWith('parent');
    store.start('sign-up');
    await store.submitContact(congolese);

    await store.verifyCode('123456');

    expect(session.activeRole()).toBe('teacher');
  });
});

describe('joinEntry and guestOrJoining — the invitation screens’ guards (A-23)', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  function launch(stored?: unknown) {
    localStorage.clear();
    if (stored) localStorage.setItem('mk.session', JSON.stringify(stored));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), AuthFlowStore, { provide: AuthApi, useValue: stubApi([]) }],
    });
    return TestBed.inject(AuthFlowStore);
  }
  const run = (guard: CanActivateFn) => {
    const result = TestBed.runInInjectionContext(() => guard(route, state));
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result;
  };
  const ready = {
    id: 'a1',
    identifier: congolese,
    activeRole: 'parent',
    roles: { parent: 'ready' },
  };

  afterEach(() => localStorage.clear());

  it('a guest: the invitation screens as before; the join entry only leads to them', () => {
    const flow = launch();

    expect(run(guestOrJoining)).toBe(true);
    expect(run(joinEntry)).toBe('/auth/invitation');
    expect(flow.joining()).toBe(false);
  });

  it('a signed-in account typing the address goes back to its space', () => {
    launch(ready);

    expect(run(guestOrJoining)).toBe('/parent-feed');
  });

  it('a signed-in account entering through the join entry is let in, session kept', () => {
    const flow = launch(ready);

    expect(run(joinEntry)).toBe('/auth/invitation');

    expect(flow.joining()).toBe(true);
    expect(run(guestOrJoining)).toBe(true);
    expect(TestBed.inject(SessionStore).signedIn()).toBe(true);
  });

  it('once the join is left, the screens close again to the account', () => {
    const flow = launch(ready);
    run(joinEntry);

    flow.leaveJoin();

    expect(run(guestOrJoining)).toBe('/parent-feed');
  });

  it('a session with no ready space yet (step 2 to do) is still treated as a guest', () => {
    launch({ ...ready, roles: { parent: 'setup' } });

    expect(run(guestOrJoining)).toBe(true);
  });
});
