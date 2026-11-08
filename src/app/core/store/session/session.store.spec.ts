import { TestBed } from '@angular/core/testing';

import { RoleStatus, Session } from '@core/models/auth.model';

import { SessionStore } from './session.store';

const SESSION_KEY = 'mk.session';
const identifier = { channel: 'phone', value: '+242066123456' } as const;

/** Writes what an app launch will find, then launches: the store reads it at creation. */
function launch(stored?: unknown, onboardingSeen = true) {
  TestBed.resetTestingModule();
  if (stored !== undefined) localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
  if (onboardingSeen) localStorage.setItem('mk.onboarding-seen', 'true');
  return TestBed.inject(SessionStore);
}

const stored = () => JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as unknown;

describe('SessionStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  describe('a session saved before ID-02 (one role)', () => {
    it('is converted, not dropped: one role, its step 2 as it was, shown', () => {
      const store = launch({
        id: 'a1',
        role: 'parent',
        identifier,
        name: 'MBEMBA Aline',
        profileComplete: true,
      });

      const expected: Session = {
        id: 'a1',
        identifier,
        name: 'MBEMBA Aline',
        activeRole: 'parent',
        roles: { parent: 'ready' },
      };
      expect(store.session()).toEqual(expected);
      expect(store.roles()).toEqual(['parent']);
      expect(store.initialRoute()).toBe('/parent-feed');
      // Written back in the current form.
      expect(stored()).toEqual(expected);
    });

    it('keeps a step 2 still to do', () => {
      const store = launch({ id: 'a1', role: 'teacher', identifier, profileComplete: false });

      expect(store.session()).toEqual({
        id: 'a1',
        identifier,
        activeRole: 'teacher',
        roles: { teacher: 'setup' },
      });
      expect(store.initialRoute()).toBe('/auth/profile');
    });
  });

  describe('a session of unknown form is dropped (no endless redirect at launch)', () => {
    const unknown: [string, unknown][] = [
      [
        'a role the code no longer knows',
        { id: 'a1', role: 'prof', identifier, profileComplete: true },
      ],
      [
        'an active role the account does not hold',
        { id: 'a1', identifier, activeRole: 'parent', roles: { teacher: 'ready' } },
      ],
      ['no role', { id: 'a1', identifier, activeRole: 'teacher', roles: {} }],
      [
        'an unknown status',
        { id: 'a1', identifier, activeRole: 'teacher', roles: { teacher: 'done' } },
      ],
      [
        'an unknown role among known ones',
        {
          id: 'a1',
          identifier,
          activeRole: 'teacher',
          roles: { teacher: 'ready', admin: 'ready' },
        },
      ],
      ['no identifier', { id: 'a1', activeRole: 'teacher', roles: { teacher: 'ready' } }],
    ];

    for (const [what, value] of unknown) {
      it(what, () => {
        const store = launch(value);

        expect(store.session()).toBeNull();
        expect(stored()).toBeNull();
        expect(store.initialRoute()).toBe('/auth');
      });
    }
  });

  describe('initialRoute', () => {
    it('without a session: onboarding, then sign-in once it was seen', () => {
      expect(launch(undefined, false).initialRoute()).toBe('/onboarding');
      expect(launch(undefined, true).initialRoute()).toBe('/auth');
    });

    const cases: [string, Session, string][] = [
      ['teacher, profile to fill', session('teacher', { teacher: 'setup' }), '/auth/profile'],
      ['parent, alerts to set', session('parent', { parent: 'setup' }), '/auth/alerts'],
      ['teacher ready', session('teacher', { teacher: 'ready' }), '/classroom'],
      ['parent ready', session('parent', { parent: 'ready' }), '/parent-feed'],
      [
        'two roles, parent shown, alerts to set',
        session('parent', { teacher: 'ready', parent: 'setup' }),
        '/auth/alerts',
      ],
      [
        'two roles, teacher shown, profile to fill',
        session('teacher', { teacher: 'setup', parent: 'ready' }),
        '/auth/profile',
      ],
      [
        'two roles, teacher shown and ready',
        session('teacher', { teacher: 'ready', parent: 'setup' }),
        '/classroom',
      ],
      [
        'two roles, parent shown and ready',
        session('parent', { teacher: 'ready', parent: 'ready' }),
        '/parent-feed',
      ],
    ];

    for (const [what, value, route] of cases) {
      it(`${what} → ${route}`, () => {
        expect(launch(value).initialRoute()).toBe(route);
      });
    }
  });

  describe('switchSpace', () => {
    it('shows a role the account holds, and the next launch reopens it', () => {
      const store = launch(session('teacher', { teacher: 'ready', parent: 'ready' }));

      store.switchSpace('parent');

      expect(store.activeRole()).toBe('parent');
      expect(store.initialRoute()).toBe('/parent-feed');
      expect(launch().activeRole()).toBe('parent');
    });

    it('opens the step 2 of a space that is not ready', () => {
      const store = launch(session('teacher', { teacher: 'ready', parent: 'setup' }));

      store.switchSpace('parent');

      expect(store.initialRoute()).toBe('/auth/alerts');
    });

    it('does nothing for a role the account does not hold', () => {
      const before = session('teacher', { teacher: 'ready' });
      const store = launch(before);

      store.switchSpace('parent');

      expect(store.session()).toEqual(before);
      expect(stored()).toEqual(before);
    });

    it('does nothing when signed out', () => {
      const store = launch();

      store.switchSpace('parent');

      expect(store.session()).toBeNull();
      expect(stored()).toBeNull();
    });
  });

  describe('signIn — the space a sign-in opens (A-22, 8 November 2026)', () => {
    const both = (activeRole: 'teacher' | 'parent', teacher: RoleStatus, parent: RoleStatus) =>
      ({ id: 'a1', identifier, activeRole, roles: { teacher, parent } }) as Session;

    it('1. the last space this account used on this device, even with a step 2 left elsewhere', () => {
      const store = launch();
      store.open(both('parent', 'setup', 'ready'));
      store.close();

      // The server knows no active space: whatever it says is not followed.
      store.signIn(both('teacher', 'setup', 'ready'));

      expect(store.activeRole()).toBe('parent');
      expect(store.initialRoute()).toBe('/parent-feed');
    });

    it('2. else a space whose step 2 is still to do', () => {
      const store = launch();

      store.signIn(both('teacher', 'ready', 'setup'));

      expect(store.activeRole()).toBe('parent');
      expect(store.initialRoute()).toBe('/auth/alerts');
    });

    it('3. else the teacher space', () => {
      const store = launch();

      store.signIn(both('parent', 'ready', 'ready'));

      expect(store.activeRole()).toBe('teacher');
      expect(store.initialRoute()).toBe('/classroom');
    });

    it('a single role: that space, whatever the rule says', () => {
      const store = launch();

      store.signIn(session('parent', { parent: 'ready' }));

      expect(store.activeRole()).toBe('parent');
    });

    it('a space remembered but no longer held is passed over', () => {
      const store = launch();
      store.open(both('parent', 'ready', 'ready'));
      store.close();

      store.signIn(session('teacher', { teacher: 'ready' }));

      expect(store.activeRole()).toBe('teacher');
    });

    it('the space switched to is the one remembered — signing out does not forget it', () => {
      const store = launch(both('teacher', 'ready', 'ready'));
      store.switchSpace('parent');
      store.close();

      expect(launch().signedIn()).toBe(false);
      const again = launch();
      again.signIn(both('teacher', 'ready', 'ready'));

      expect(again.activeRole()).toBe('parent');
    });

    it('one account’s memory never decides for another account on the same phone', () => {
      const store = launch();
      store.open(both('parent', 'ready', 'ready'));
      store.close();

      const other = { ...both('parent', 'ready', 'ready'), id: 'a2' } as Session;
      store.signIn(other);

      expect(store.activeRole()).toBe('teacher');
      // And a1 still finds its own.
      store.close();
      store.signIn(both('teacher', 'ready', 'ready'));
      expect(store.activeRole()).toBe('parent');
    });

    it('stores a role per account id, nothing else', () => {
      const store = launch();
      store.open(both('parent', 'ready', 'ready'));
      store.open({ ...session('teacher', { teacher: 'ready' }), id: 'a2' });

      expect(JSON.parse(localStorage.getItem('mk.last-space')!)).toEqual({
        a1: 'parent',
        a2: 'teacher',
      });
    });
  });

  it('otherRoles: the spaces of the account other than the one shown', () => {
    expect(launch(session('teacher', { teacher: 'ready', parent: 'setup' })).otherRoles()).toEqual([
      'parent',
    ]);
    expect(launch(session('parent', { parent: 'ready' })).otherRoles()).toEqual([]);
    expect(launch().otherRoles()).toEqual([]);
  });

  it('reads the roles of the account', () => {
    const store = launch(session('parent', { parent: 'setup', teacher: 'ready' }));

    expect(store.roles()).toEqual(['teacher', 'parent']);
    expect(store.hasRole('teacher')).toBe(true);
    expect(store.isReady('teacher')).toBe(true);
    expect(store.isReady('parent')).toBe(false);
    expect(store.ready()).toBe(false);
    expect(store.hasReadySpace()).toBe(true);
  });

  it('close() signs out of every role', () => {
    const store = launch(session('parent', { parent: 'ready', teacher: 'ready' }));

    store.close();

    expect(store.signedIn()).toBe(false);
    expect(store.roles()).toEqual([]);
    expect(stored()).toBeNull();
  });
});

function session(
  activeRole: 'teacher',
  roles: Extract<Session, { activeRole: 'teacher' }>['roles'],
): Session;
function session(
  activeRole: 'parent',
  roles: Extract<Session, { activeRole: 'parent' }>['roles'],
): Session;
function session(activeRole: Session['activeRole'], roles: Session['roles']): Session {
  return { id: 'a1', identifier, activeRole, roles } as Session;
}
