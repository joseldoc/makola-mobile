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

import { guestOnly } from './guest-only.guard';
import { profileStep } from './profile-step.guard';

const identifier = { channel: 'phone', value: '+242066123456' } as const;
const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

function launch(stored: Session): void {
  localStorage.setItem('mk.session', JSON.stringify(stored));
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
}

function outcome(result: unknown): string | true {
  return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : (result as true);
}

const step = (role: Role) =>
  outcome(TestBed.runInInjectionContext(() => profileStep(role)(route, state)));
const activeRole = () => TestBed.inject(SessionStore).activeRole();

describe('profileStep — an account with two roles', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('opens the step 2 of the role that has not done it — each role has its own', () => {
    launch({
      id: 'a1',
      identifier,
      activeRole: 'parent',
      roles: { teacher: 'ready', parent: 'setup' },
    });

    expect(step('parent')).toBe(true);
    expect(step('teacher')).toBe('/auth/alerts');
  });

  it('makes that role the one shown: a launch in the middle of the step comes back to it', () => {
    launch({
      id: 'a1',
      identifier,
      activeRole: 'teacher',
      roles: { teacher: 'ready', parent: 'setup' },
    });

    expect(step('parent')).toBe(true);
    expect(activeRole()).toBe('parent');
  });

  it('refuses once both are done', () => {
    launch({
      id: 'a1',
      identifier,
      activeRole: 'teacher',
      roles: { teacher: 'ready', parent: 'ready' },
    });

    expect(step('parent')).toBe('/classroom');
    expect(step('teacher')).toBe('/classroom');
    expect(activeRole()).toBe('teacher');
  });

  it('refuses without a session', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });

    expect(step('teacher')).toBe('/onboarding');
  });
});

describe('guestOnly — an account with two roles', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  const guest = () => outcome(TestBed.runInInjectionContext(() => guestOnly(route, state)));

  it('sends away whoever has a ready space, even when the space shown is not ready', () => {
    launch({
      id: 'a1',
      identifier,
      activeRole: 'parent',
      roles: { teacher: 'ready', parent: 'setup' },
    });

    expect(guest()).toBe('/auth/alerts');
  });

  it('lets a session with no ready space go back to the entry screens', () => {
    launch({ id: 'a1', identifier, activeRole: 'teacher', roles: { teacher: 'setup' } });

    expect(guest()).toBe(true);
  });
});
