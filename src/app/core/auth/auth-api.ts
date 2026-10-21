import { CodeRequest, Identifier, Intent, Invitation, ParentAlerts, Session, TeacherProfile } from './auth.model';

export type AuthErrorCode = 'unknown-account' | 'existing-account' | 'wrong-code' | 'unknown-invitation' | 'offline';

/**
 * Refusal returned by the server. The screen turns `code` into a translated
 * message that always says what the user can do (interface contract §7.6).
 */
export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
  }
}

/**
 * Contract of the authentication server. Provided in `app.config.ts`: today
 * `MockAuthApi`, tomorrow the HTTP implementation — no screen changes.
 * Every method rejects with an `AuthError`.
 */
export abstract class AuthApi {
  /** Sends a 6-digit code by SMS or email. */
  abstract requestCode(identifier: Identifier, intent: Intent): Promise<CodeRequest>;

  /** Checks the code and opens a session. `invitation` links the parent to the child. */
  abstract verifyCode(identifier: Identifier, code: string, intent: Intent, invitation?: Invitation): Promise<Session>;

  /** Teacher profile: the account is only active after it. */
  abstract completeProfile(session: Session, profile: TeacherProfile): Promise<Session>;

  /** Shows the linked child BEFORE confirmation (US-PA01). */
  abstract checkInvitation(code: string): Promise<Invitation>;

  /** Alert settings offered before the first access to the feed (RM-16). */
  abstract saveAlerts(session: Session, alerts: ParentAlerts): Promise<Session>;
}
