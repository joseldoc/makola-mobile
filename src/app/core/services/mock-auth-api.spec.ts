import { Identifier, Invitation, Session } from '@core/models/auth.model';

import { AuthError } from './auth-api';
import { DEMO_CODE, MockAuthApi } from './mock-auth-api';

const ACCOUNTS_KEY = 'mk.mock.accounts';
const number: Identifier = { channel: 'phone', value: '+242066123456' };
const invitation: Invitation = {
  code: '482913',
  student: 'ILUNGA Marie',
  classroom: '4ème B',
  school: 'Lycée Chaminade',
  teacher: 'M. NKOUKA',
  subject: 'Mathématiques',
};

const accounts = () =>
  JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '{}') as Record<string, Session>;

describe('MockAuthApi — several roles on one account (ID-02)', () => {
  let api: MockAuthApi;

  /** Runs a call through the mock network delay. */
  async function call<T>(promise: Promise<T>): Promise<T> {
    const settled = promise.then(
      (value) => ({ value }),
      (error: unknown) => ({ error }),
    );
    await vi.runAllTimersAsync();
    const result = await settled;
    if ('error' in result) throw result.error;
    return result.value;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    localStorage.clear();
    api = new MockAuthApi();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  async function teacherAccount(): Promise<Session> {
    const signedUp = await call(api.verifyCode(number, DEMO_CODE, 'sign-up'));
    return call(
      api.completeProfile(signedUp, {
        lastName: 'Nkouka',
        firstName: 'Joseph',
        subjects: ['maths'],
        levels: ['high'],
        city: 'Brazzaville',
        country: 'CG',
      }),
    );
  }

  it('an existing teacher who accepts an invitation keeps the teacher role and profile, receives the parent role, and lands on its alerts', async () => {
    const teacher = await teacherAccount();
    expect(teacher.roles).toEqual({ teacher: 'ready' });

    const opened = await call(api.verifyCode(number, DEMO_CODE, 'invitation', invitation));

    expect(opened.id).toBe(teacher.id);
    expect(opened.name).toBe('NKOUKA Joseph');
    expect(opened.roles).toEqual({ teacher: 'ready', parent: 'setup' });
    expect(opened.activeRole).toBe('parent');
    expect(accounts()[`phone:${number.value}`]).toEqual(opened);
  });

  it('the parent alerts then make both spaces ready', async () => {
    await teacherAccount();
    const opened = await call(api.verifyCode(number, DEMO_CODE, 'invitation', invitation));

    const ready = await call(
      api.saveAlerts(opened, {
        newGrade: true,
        gradeBelowPass: false,
        testAnnounced: true,
        reportCardAvailable: true,
        weeklySummary: false,
      }),
    );

    expect(ready.roles).toEqual({ teacher: 'ready', parent: 'ready' });
    // Signing in again finds both roles.
    expect((await call(api.verifyCode(number, DEMO_CODE, 'sign-in'))).roles).toEqual({
      teacher: 'ready',
      parent: 'ready',
    });
  });

  it('a contact without an account gets a parent account, alerts to set', async () => {
    const opened = await call(api.verifyCode(number, DEMO_CODE, 'invitation', invitation));

    expect(opened.roles).toEqual({ parent: 'setup' });
    expect(opened.activeRole).toBe('parent');
  });

  it('a parent joining a new invitation sets their alerts for this child again', async () => {
    const first = await call(api.verifyCode(number, DEMO_CODE, 'invitation', invitation));
    await call(
      api.saveAlerts(first, {
        newGrade: true,
        gradeBelowPass: false,
        testAnnounced: true,
        reportCardAvailable: true,
        weeklySummary: false,
      }),
    );

    const again = await call(api.verifyCode(number, DEMO_CODE, 'invitation', invitation));

    expect(again.id).toBe(first.id);
    expect(again.roles).toEqual({ parent: 'setup' });
  });

  it('a parent cannot sign up as a teacher with the same number: refused, as the contract does', async () => {
    await call(api.verifyCode(number, DEMO_CODE, 'invitation', invitation));

    await expect(call(api.requestCode(number, 'sign-up'))).rejects.toEqual(
      new AuthError('existing-account'),
    );
  });

  it('converts the accounts saved before ID-02 (one role)', async () => {
    localStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify({
        [`phone:${number.value}`]: {
          id: 'a1',
          role: 'teacher',
          identifier: number,
          name: 'NKOUKA Joseph',
          profileComplete: true,
        },
      }),
    );

    const signedIn = await call(api.verifyCode(number, DEMO_CODE, 'sign-in'));
    expect(signedIn).toEqual({
      id: 'a1',
      identifier: number,
      name: 'NKOUKA Joseph',
      activeRole: 'teacher',
      roles: { teacher: 'ready' },
    });

    const opened = await call(api.verifyCode(number, DEMO_CODE, 'invitation', invitation));
    expect(opened.roles).toEqual({ teacher: 'ready', parent: 'setup' });
    expect(accounts()[`phone:${number.value}`]).toEqual(opened);
  });
});
