import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { Identifier, Invitation, ParentalConsent } from '@core/models/auth.model';
import { AuthApi } from '@core/services/auth-api';

import { consentsRequired } from '../auth.routes';
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
