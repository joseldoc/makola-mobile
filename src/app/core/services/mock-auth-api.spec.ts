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

/** Everything the mock has stored. */
const stored = () =>
  Object.fromEntries(
    Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!).map((k) => [
      k,
      localStorage.getItem(k),
    ]),
  );

/** Runs a call through the mock network delay (fake timers). */
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

describe('MockAuthApi — several roles on one account (ID-02)', () => {
  let api: MockAuthApi;

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

    const opened = await call(
      api.verifyCode(number, DEMO_CODE, 'invitation', { invitation, consents: [] }),
    );

    expect(opened.id).toBe(teacher.id);
    expect(opened.name).toBe('NKOUKA Joseph');
    expect(opened.roles).toEqual({ teacher: 'ready', parent: 'setup' });
    expect(opened.activeRole).toBe('parent');
    expect(accounts()[`phone:${number.value}`]).toEqual(opened);
  });

  it('the parent alerts then make both spaces ready', async () => {
    await teacherAccount();
    const opened = await call(
      api.verifyCode(number, DEMO_CODE, 'invitation', { invitation, consents: [] }),
    );

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
    const opened = await call(
      api.verifyCode(number, DEMO_CODE, 'invitation', { invitation, consents: [] }),
    );

    expect(opened.roles).toEqual({ parent: 'setup' });
    expect(opened.activeRole).toBe('parent');
  });

  it('a parent joining a new invitation sets their alerts for this child again', async () => {
    const first = await call(
      api.verifyCode(number, DEMO_CODE, 'invitation', { invitation, consents: [] }),
    );
    await call(
      api.saveAlerts(first, {
        newGrade: true,
        gradeBelowPass: false,
        testAnnounced: true,
        reportCardAvailable: true,
        weeklySummary: false,
      }),
    );

    const again = await call(
      api.verifyCode(number, DEMO_CODE, 'invitation', { invitation, consents: [] }),
    );

    expect(again.id).toBe(first.id);
    expect(again.roles).toEqual({ parent: 'setup' });
  });

  it('a parent cannot sign up as a teacher with the same number: refused, as the contract does', async () => {
    await call(api.verifyCode(number, DEMO_CODE, 'invitation', { invitation, consents: [] }));

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

    const opened = await call(
      api.verifyCode(number, DEMO_CODE, 'invitation', { invitation, consents: [] }),
    );
    expect(opened.roles).toEqual({ teacher: 'ready', parent: 'setup' });
    expect(accounts()[`phone:${number.value}`]).toEqual(opened);
  });
});

describe('MockAuthApi — Kenyan parental consents (RI-20)', () => {
  const BOTH = ['CHILD_DATA', 'CROSS_BORDER_TRANSFER'];
  const congolese: Identifier = { channel: 'phone', value: '+242066123456' };
  const kenyan: Identifier = { channel: 'phone', value: '+254712345678' };
  let api: MockAuthApi;
  let congo: Invitation;
  let kenya: Invitation;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    localStorage.clear();
    api = new MockAuthApi();
    congo = await call(api.checkInvitation('482913'));
    kenya = await call(api.checkInvitation('730615'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('keeps its own data: the teacher’s country and the student id never leave the mock', () => {
    expect(kenya).toEqual({
      code: '730615',
      student: 'KAMAU Wanjiru',
      classroom: 'Form 2 East',
      school: 'Baobab Hill Secondary School',
      teacher: 'Ms ODHIAMBO',
      subject: 'Mathematics',
    });
    expect(Object.keys(congo)).not.toContain('teacherCountry');
  });

  it('Congolese teacher, Congolese parent: no consent asked', async () => {
    expect(await call(api.requiredConsents(congolese, congo))).toEqual([]);
  });

  it('Kenyan teacher, Congolese parent: both asked — the teacher’s country counts (union)', async () => {
    expect(await call(api.requiredConsents(congolese, kenya))).toEqual(BOTH);
  });

  it('Congolese teacher, Kenyan parent: both asked — the parent’s country counts (union)', async () => {
    expect(await call(api.requiredConsents(kenyan, congo))).toEqual(BOTH);
  });

  it('invited by email, the parent takes the teacher’s country (RI-18)', async () => {
    const email: Identifier = { channel: 'email', value: 'parent@example.com' };
    expect(await call(api.requiredConsents(email, kenya))).toEqual(BOTH);
    expect(await call(api.requiredConsents(email, congo))).toEqual([]);
  });

  it('already given by this account for this student: not asked again', async () => {
    await call(
      api.verifyCode(congolese, DEMO_CODE, 'invitation', {
        invitation: kenya,
        consents: ['CHILD_DATA', 'CROSS_BORDER_TRANSFER'],
      }),
    );

    expect(await call(api.requiredConsents(congolese, kenya))).toEqual([]);
    // Another contact, or another student, is asked again.
    expect(await call(api.requiredConsents(kenyan, kenya))).toEqual(BOTH);
    expect(await call(api.requiredConsents(congolese, congo))).toEqual([]);
  });

  it('refuses the acceptance without the documents asked, and writes nothing', async () => {
    // A teacher account exists already: the refusal must not touch it either.
    await call(api.verifyCode(congolese, DEMO_CODE, 'sign-up'));
    const before = stored();
    expect(Object.keys(before)).toEqual(['mk.mock.accounts']);

    await expect(
      call(api.verifyCode(congolese, DEMO_CODE, 'invitation', { invitation: kenya, consents: [] })),
    ).rejects.toEqual(new AuthError('parental-consent-required'));
    await expect(
      call(
        api.verifyCode(congolese, DEMO_CODE, 'invitation', {
          invitation: kenya,
          consents: ['CHILD_DATA'],
        }),
      ),
    ).rejects.toEqual(new AuthError('parental-consent-required'));

    expect(stored()).toEqual(before);
    expect(accounts()[`phone:${congolese.value}`].roles).toEqual({ teacher: 'setup' });
  });

  it('accepts once both are given; a Congolese invitation needs none', async () => {
    const opened = await call(
      api.verifyCode(kenyan, DEMO_CODE, 'invitation', {
        invitation: kenya,
        consents: ['CROSS_BORDER_TRANSFER', 'CHILD_DATA'],
      }),
    );
    expect(opened.roles).toEqual({ parent: 'setup' });

    const other = await call(
      api.verifyCode(congolese, DEMO_CODE, 'invitation', { invitation: congo, consents: [] }),
    );
    expect(other.roles).toEqual({ parent: 'setup' });
  });
});
