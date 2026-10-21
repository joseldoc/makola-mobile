import { Injectable } from '@angular/core';

import { AuthApi, AuthError } from './auth-api';
import { CodeRequest, Identifier, Intent, Invitation, ParentAlerts, Session, TeacherProfile } from './auth.model';

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
 * previous sign-up. OTP code: {@link DEMO_CODE}. Parent invitation: 482913.
 */
@Injectable()
export class MockAuthApi extends AuthApi {
  async requestCode(identifier: Identifier, intent: Intent): Promise<CodeRequest> {
    await this.network();
    const account = this.accounts()[this.key(identifier)];
    if (intent === 'sign-up' && account) throw new AuthError('existing-account');
    if (intent === 'sign-in' && !account) throw new AuthError('unknown-account');
    console.info(`[MockAuthApi] Code sent to ${identifier.value}: ${DEMO_CODE}`);
    return { resendIn: RESEND_S };
  }

  async verifyCode(identifier: Identifier, code: string, intent: Intent, invitation?: Invitation): Promise<Session> {
    await this.network();
    if (code !== DEMO_CODE) throw new AuthError('wrong-code');

    const accounts = this.accounts();
    const key = this.key(identifier);
    const existing = accounts[key];
    if (existing && intent !== 'invitation') return existing;

    const session: Session = existing ?? {
      id: crypto.randomUUID(),
      role: intent === 'invitation' ? 'parent' : 'teacher',
      identifier,
      profileComplete: false
    };
    if (invitation) console.info(`[MockAuthApi] ${key} linked to ${invitation.student}.`);
    // A parent joining a new invitation sets their alerts for this child.
    const opened = intent === 'invitation' ? { ...session, profileComplete: false } : session;
    this.save({ ...accounts, [key]: opened });
    return opened;
  }

  async completeProfile(session: Session, profile: TeacherProfile): Promise<Session> {
    await this.network();
    return this.update({ ...session, name: `${profile.lastName.toUpperCase()} ${profile.firstName}`, profileComplete: true });
  }

  async checkInvitation(code: string): Promise<Invitation> {
    await this.network();
    const invitation = INVITATIONS[code];
    if (!invitation) throw new AuthError('unknown-invitation');
    return { code, ...invitation };
  }

  async saveAlerts(session: Session, _alerts: ParentAlerts): Promise<Session> {
    await this.network();
    return this.update({ ...session, profileComplete: true });
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

  private accounts(): Accounts {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '{}') as Accounts;
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
