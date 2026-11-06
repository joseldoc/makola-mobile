import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { Role, Session } from '@core/models/auth.model';
import { SessionStore } from '@core/store/session/session.store';

import { activeAccount } from './active-account.guard';

const identifier = { channel: 'phone', value: '+242066123456' } as const;

/** Launches the app on this stored session, then runs the guard. */
function enter(role: Role, stored: Session): string | true {
  localStorage.setItem('mk.session', JSON.stringify(stored));
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const result = TestBed.runInInjectionContext(() =>
    activeAccount(role)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
  return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : (result as true);
}

const activeRole = () => TestBed.inject(SessionStore).activeRole();

describe('activeAccount — an account with two roles', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('lets in the space shown when its step 2 is done', () => {
    expect(
      enter('teacher', {
        id: 'a1',
        identifier,
        activeRole: 'teacher',
        roles: { teacher: 'ready', parent: 'ready' },
      }),
    ).toBe(true);
    expect(activeRole()).toBe('teacher');
  });

  it('lets in the other space when ready, which becomes the one shown (a link, a notification)', () => {
    expect(
      enter('parent', {
        id: 'a1',
        identifier,
        activeRole: 'teacher',
        roles: { teacher: 'ready', parent: 'ready' },
      }),
    ).toBe(true);
    expect(activeRole()).toBe('parent');
    // Kept for the next launch: the last space shown.
    expect(JSON.parse(localStorage.getItem('mk.session')!).activeRole).toBe('parent');
  });

  it('refuses a space whose step 2 is not done: back to where the account stands, shown space unchanged', () => {
    expect(
      enter('parent', {
        id: 'a1',
        identifier,
        activeRole: 'teacher',
        roles: { teacher: 'ready', parent: 'setup' },
      }),
    ).toBe('/classroom');
    expect(activeRole()).toBe('teacher');
  });

  it('refuses a role the account does not hold', () => {
    expect(
      enter('parent', { id: 'a1', identifier, activeRole: 'teacher', roles: { teacher: 'ready' } }),
    ).toBe('/classroom');
    expect(activeRole()).toBe('teacher');
  });
});
