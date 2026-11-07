import {
  CodeRequest,
  Identifier,
  Intent,
  Invitation,
  InvitationAcceptance,
  ParentAlerts,
  ParentalConsent,
  Session,
  TeacherProfile,
} from '@core/models/auth.model';

export type AuthErrorCode =
  | 'unknown-account'
  | 'existing-account'
  | 'wrong-code'
  | 'unknown-invitation'
  | 'parental-consent-required'
  | 'offline';

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

  /**
   * Checks the code and opens a session. `acceptance` links the parent to the
   * child, with the parental consents given: one asked but missing is refused
   * with `parental-consent-required`, and nothing is written (RI-20).
   */
  abstract verifyCode(
    identifier: Identifier,
    code: string,
    intent: Intent,
    acceptance?: InvitationAcceptance,
  ): Promise<Session>;

  /** Teacher profile: the account is only active after it. */
  abstract completeProfile(session: Session, profile: TeacherProfile): Promise<Session>;

  /** Shows the linked child BEFORE confirmation (US-PA01). */
  abstract checkInvitation(code: string): Promise<Invitation>;

  /**
   * The parental consents the acceptance will ask for, once the parent's contact
   * is known (RI-20) — Identity's invitation preview (`POST /v1/invitations/preview`,
   * contact and code → `requiredConsents`). Possibly none: the server decides,
   * from the parent's and the teacher's countries; one already given for this
   * student is not asked again.
   */
  abstract requiredConsents(
    contact: Identifier,
    invitation: Invitation,
  ): Promise<ParentalConsent[]>;

  /** Alert settings offered before the first access to the feed (RM-16). */
  abstract saveAlerts(session: Session, alerts: ParentAlerts): Promise<Session>;
}
