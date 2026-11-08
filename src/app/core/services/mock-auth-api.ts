import { Injectable } from '@angular/core';

import { AuthApi, AuthError } from './auth-api';
import {
  CodeRequest,
  Identifier,
  Intent,
  Invitation,
  InvitationAcceptance,
  PARENTAL_CONSENTS,
  ParentAlerts,
  ParentalConsent,
  Session,
  TeacherProfile,
} from '@core/models/auth.model';
import { CountryCode, countryOfNumber } from '@core/models/country';
import { parseSession, withRole } from '@core/models/session';

/** Code accepted by the mock server — any other entry is refused. */
export const DEMO_CODE = '123456';

/**
 * An invitation as the mock server keeps it. `studentId` and `teacherCountry` are
 * its own data, never returned: Identity keys consents by student and applies the
 * union rule itself (RI-20) — its preview gives neither.
 */
interface MockInvitation extends Omit<Invitation, 'code'> {
  studentId: string;
  /** Country of the account of the teacher who invites. */
  teacherCountry: CountryCode;
}

/** Invitations known by the mock server. Names, schools and classes are fictitious. */
const INVITATIONS: Record<string, MockInvitation> = {
  // Congo (data from the @makola UI kit): no parental consent, unless the parent's number is Kenyan.
  '482913': {
    studentId: 'mock-student-1',
    teacherCountry: 'CG',
    student: 'ILUNGA Marie',
    classroom: '4ème B',
    school: 'Lycée Chaminade',
    teacher: 'M. NKOUKA',
    subject: 'Mathématiques',
  },
  // Kenya: both parental consents, whatever the parent's country.
  '730615': {
    studentId: 'mock-student-2',
    teacherCountry: 'KE',
    student: 'KAMAU Wanjiru',
    classroom: 'Form 2 East',
    school: 'Baobab Hill Secondary School',
    teacher: 'Ms ODHIAMBO',
    subject: 'Mathematics',
  },
};

/**
 * Mirror of `country_config.parental_consents` (RI-20): what each country's law
 * asks for at the acceptance. A new country is an entry — the type requires one.
 */
const PARENTAL_CONSENTS_BY_COUNTRY: Record<CountryCode, ParentalConsent[]> = {
  CG: [],
  KE: ['CHILD_DATA', 'CROSS_BORDER_TRANSFER'],
};

const LATENCY_MS = 700;
const RESEND_S = 45;
const ACCOUNTS_KEY = 'mk.mock.accounts';
/** Consents given, by account id then student id — as Identity keeps them (`consent`). */
const CONSENTS_KEY = 'mk.mock.consents';

type Accounts = Record<string, Session>;
type GivenConsents = Record<string, Record<string, ParentalConsent[]>>;

/**
 * Mock authentication server — this repository has no backend yet.
 * Created accounts are kept in `localStorage` so that signing in finds a
 * previous sign-up. OTP code: {@link DEMO_CODE}.
 *
 * Parent invitations:
 * - 482913 — teacher in the Republic of the Congo (ILUNGA Marie, Lycée Chaminade).
 *   No consent is asked with a Congolese number; both are with a Kenyan one.
 * - 730615 — teacher in Kenya (KAMAU Wanjiru, Baobab Hill Secondary School,
 *   fictitious). Both parental consents are asked, whatever the parent's number.
 *
 * Accepted with the number of an existing teacher account, an invitation gives
 * that account the parent role as well (ID-02). Parental consents follow RI-20:
 * asked when the parent's country or the teacher's asks for them (union), not
 * asked again once given by the account for the student, and the acceptance is
 * refused without them, nothing written. Document versions are not simulated.
 */
@Injectable()
export class MockAuthApi extends AuthApi {
  async requestCode(identifier: Identifier, intent: Intent): Promise<CodeRequest> {
    await this.network();
    const account = this.accounts()[this.key(identifier)];
    // As Identity (`POST /v1/accounts`, ACCOUNT_ALREADY_EXISTS), parent account
    // included: the contract documents no sign-up that adds the teacher role to
    // an existing account — a question left open, not a path to invent here.
    if (intent === 'sign-up' && account) throw new AuthError('existing-account');
    if (intent === 'sign-in' && !account) throw new AuthError('unknown-account');
    console.info(`[MockAuthApi] Code sent to ${identifier.value}: ${DEMO_CODE}`);
    return { resendIn: RESEND_S };
  }

  async verifyCode(
    identifier: Identifier,
    code: string,
    intent: Intent,
    acceptance?: InvitationAcceptance,
  ): Promise<Session> {
    await this.network();
    if (code !== DEMO_CODE) throw new AuthError('wrong-code');

    const existing = this.accounts()[this.key(identifier)];
    if (intent !== 'invitation') {
      // Sign-in: the account as it stands. Sign-up: a teacher account, profile to fill (ID-01).
      return (
        existing ??
        this.update({
          id: crypto.randomUUID(),
          identifier,
          activeRole: 'teacher',
          roles: { teacher: 'setup' },
        })
      );
    }

    // RI-20: every consent asked must be given — otherwise refused before anything is written.
    const invitation = acceptance ? this.invitation(acceptance.invitation.code) : null;
    const required = invitation ? this.required(identifier, invitation) : [];
    if (required.some((consent) => !acceptance?.consents.includes(consent))) {
      throw new AuthError('parental-consent-required');
    }

    if (invitation)
      console.info(`[MockAuthApi] ${this.key(identifier)} linked to ${invitation.student}.`);
    // Identity contract (invitation preview, `registrationRequired`): an account
    // is created for an unknown contact; an existing account receives the role —
    // a teacher keeps their role and profile (ID-02). Either way the parent space
    // goes to its step 2 and is shown: a parent joining a new invitation sets
    // their alerts for this child (US-PA01).
    const account: Session = existing ?? {
      id: crypto.randomUUID(),
      identifier,
      activeRole: 'parent',
      roles: { parent: 'setup' },
    };
    const opened = this.update({
      ...account,
      activeRole: 'parent',
      roles: { ...account.roles, parent: 'setup' },
    });
    // Only what was asked is recorded: a document given beyond it has no effect.
    if (invitation && required.length)
      this.recordConsents(opened.id, invitation.studentId, required);
    return opened;
  }

  async completeProfile(session: Session, profile: TeacherProfile): Promise<Session> {
    await this.network();
    return this.update(
      withRole(
        { ...session, name: `${profile.lastName.toUpperCase()} ${profile.firstName}` },
        'teacher',
        'ready',
      ),
    );
  }

  async checkInvitation(code: string): Promise<Invitation> {
    await this.network();
    // The mock's own data (student id, teacher's country) stays here.
    const {
      studentId: _studentId,
      teacherCountry: _teacherCountry,
      ...shown
    } = this.invitation(code);
    return { code, ...shown };
  }

  async requiredConsents(contact: Identifier, invitation: Invitation): Promise<ParentalConsent[]> {
    await this.network();
    return this.required(contact, this.invitation(invitation.code));
  }

  async saveAlerts(session: Session, _alerts: ParentAlerts): Promise<Session> {
    await this.network();
    return this.update(withRole(session, 'parent', 'ready'));
  }

  private invitation(code: string): MockInvitation {
    const invitation = INVITATIONS[code];
    if (!invitation) throw new AuthError('unknown-invitation');
    return invitation;
  }

  /**
   * RI-20, union rule: the consents of the parent's country and of the teacher's,
   * less those this account already gave for the student. The parent's country is
   * their number's; invited by email, they take the teacher's (RI-18).
   */
  private required(contact: Identifier, invitation: MockInvitation): ParentalConsent[] {
    const parentCountry =
      contact.channel === 'phone' ? countryOfNumber(contact.value)?.code : undefined;
    const asked = new Set([
      ...PARENTAL_CONSENTS_BY_COUNTRY[invitation.teacherCountry],
      ...(parentCountry ? PARENTAL_CONSENTS_BY_COUNTRY[parentCountry] : []),
    ]);
    const account = this.accounts()[this.key(contact)];
    const given = account ? (this.consents()[account.id]?.[invitation.studentId] ?? []) : [];
    return PARENTAL_CONSENTS.filter((consent) => asked.has(consent) && !given.includes(consent));
  }

  private async network(): Promise<void> {
    await new Promise((r) => setTimeout(r, LATENCY_MS));
    if (!navigator.onLine) throw new AuthError('offline');
  }

  private update(session: Session): Session {
    this.save(ACCOUNTS_KEY, { ...this.accounts(), [this.key(session.identifier)]: session });
    return session;
  }

  private recordConsents(accountId: string, studentId: string, consents: ParentalConsent[]): void {
    const all = this.consents();
    const given = all[accountId]?.[studentId] ?? [];
    const merged = PARENTAL_CONSENTS.filter(
      (consent) => given.includes(consent) || consents.includes(consent),
    );
    this.save(CONSENTS_KEY, { ...all, [accountId]: { ...all[accountId], [studentId]: merged } });
  }

  private key(identifier: Identifier): string {
    return `${identifier.channel}:${identifier.value}`;
  }

  /** Accounts saved by an earlier version (single role) are converted like the session. */
  private accounts(): Accounts {
    const accounts: Accounts = {};
    for (const [key, value] of Object.entries(this.read(ACCOUNTS_KEY))) {
      const account = parseSession(value);
      if (account) accounts[key] = account;
    }
    return accounts;
  }

  /** Consents given; an unknown document is dropped. */
  private consents(): GivenConsents {
    const consents: GivenConsents = {};
    for (const [accountId, students] of Object.entries(this.read(CONSENTS_KEY))) {
      if (!isRecord(students)) continue;
      consents[accountId] = {};
      for (const [studentId, documents] of Object.entries(students)) {
        consents[accountId][studentId] = Array.isArray(documents)
          ? PARENTAL_CONSENTS.filter((consent) => documents.includes(consent))
          : [];
      }
    }
    return consents;
  }

  private read(key: string): Record<string, unknown> {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) ?? '{}');
      return isRecord(stored) ? stored : {};
    } catch {
      return {};
    }
  }

  private save(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (private browsing): the session stays valid in memory.
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
