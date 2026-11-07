import { Injectable } from '@angular/core';

import { AuthApi, AuthError } from './auth-api';
import { CodeRequest, Identifier, Intent, Invitation, ParentAlerts, Session, TeacherProfile } from '@core/models/auth.model';
import { parseSession, withRole } from '@core/models/session';

/** Code accepted by the mock server — any other entry is refused. */
export const DEMO_CODE = '123456';

/** Invitation known by the mock server (data from the @makola UI kit). */
const INVITATIONS: Record<string, Omit<Invitation, 'code'>> = {
  '482913': {
    student: 'ILUNGA Marie',
    classroom: '4ème B',
    school: 'Lycée Chaminade',
    teacher: 'M. NKOUKA',
    subject: 'Mathématiques'
  }
};

const LATENCY_MS = 700;
const RESEND_S = 45;
const ACCOUNTS_KEY = 'mk.mock.accounts';

type Accounts = Record<string, Session>;

/**
 * Mock authentication server — this repository has no backend yet.
 * Created accounts are kept in `localStorage` so that signing in finds a
 * previous sign-up. OTP code: {@link DEMO_CODE}. Parent invitation: 482913 —
 * accepted with the number of an existing teacher account, it gives that
 * account the parent role as well (ID-02).
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

  async verifyCode(identifier: Identifier, code: string, intent: Intent, invitation?: Invitation): Promise<Session> {
    await this.network();
    if (code !== DEMO_CODE) throw new AuthError('wrong-code');

    const existing = this.accounts()[this.key(identifier)];
    if (intent !== 'invitation') {
      // Sign-in: the account as it stands. Sign-up: a teacher account, profile to fill (ID-01).
      return existing ?? this.update({ id: crypto.randomUUID(), identifier, activeRole: 'teacher', roles: { teacher: 'setup' } });
    }

    if (invitation) console.info(`[MockAuthApi] ${this.key(identifier)} linked to ${invitation.student}.`);
    // Identity contract (invitation preview, `registrationRequired`): an account
    // is created for an unknown contact; an existing account receives the role —
    // a teacher keeps their role and profile (ID-02). Either way the parent space
    // goes to its step 2 and is shown: a parent joining a new invitation sets
    // their alerts for this child (US-PA01).
    const account: Session = existing ?? { id: crypto.randomUUID(), identifier, activeRole: 'parent', roles: { parent: 'setup' } };
    return this.update({ ...account, activeRole: 'parent', roles: { ...account.roles, parent: 'setup' } });
  }

  async completeProfile(session: Session, profile: TeacherProfile): Promise<Session> {
    await this.network();
    return this.update(withRole({ ...session, name: `${profile.lastName.toUpperCase()} ${profile.firstName}` }, 'teacher', 'ready'));
  }

  async checkInvitation(code: string): Promise<Invitation> {
    await this.network();
    const invitation = INVITATIONS[code];
    if (!invitation) throw new AuthError('unknown-invitation');
    return { code, ...invitation };
  }

  async saveAlerts(session: Session, _alerts: ParentAlerts): Promise<Session> {
    await this.network();
    return this.update(withRole(session, 'parent', 'ready'));
  }

  private async network(): Promise<void> {
    await new Promise((r) => setTimeout(r, LATENCY_MS));
    if (!navigator.onLine) throw new AuthError('offline');
  }

  private update(session: Session): Session {
    this.save({ ...this.accounts(), [this.key(session.identifier)]: session });
    return session;
  }

  private key(identifier: Identifier): string {
    return `${identifier.channel}:${identifier.value}`;
  }

  /** Accounts saved by an earlier version (single role) are converted like the session. */
  private accounts(): Accounts {
    try {
      const stored = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '{}') as Record<string, unknown>;
      const accounts: Accounts = {};
      for (const [key, value] of Object.entries(stored)) {
        const account = parseSession(value);
        if (account) accounts[key] = account;
      }
      return accounts;
    } catch {
      return {};
    }
  }

  private save(accounts: Accounts): void {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {
      // Storage unavailable (private browsing): the session stays valid in memory.
    }
  }
}
