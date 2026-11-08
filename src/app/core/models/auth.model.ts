import { CountryCode } from './country';

/**
 * The two spaces the app serves (functional spec §8); an account holds one or
 * both (ID-02). Identity also knows `SCHOOL_OWNER` and `ADMIN`: the HTTP adapter
 * will keep `TEACHER` and `PARENT` only — the app has no space for the others.
 */
export type Role = 'teacher' | 'parent';

export const ROLES: Role[] = ['teacher', 'parent'];

/**
 * The space a sign-in opens when nothing else decides (A-22, 8 November 2026):
 * no space remembered on this device, no step 2 left to do.
 */
export const DEFAULT_SPACE: Role = 'teacher';

/**
 * Where a role of the account stands. `setup`: its step 2 is still to do — the
 * teacher profile (US-P01), the parent's alert settings (RM-16, US-PA01).
 * `ready`: its space opens. Each role has its own, done independently.
 */
export type RoleStatus = 'setup' | 'ready';

export const ROLE_STATUSES: RoleStatus[] = ['setup', 'ready'];

/** Email **or** phone — never a password: access goes through a one-time code (US-P01). */
export type Channel = 'phone' | 'email';

export interface Identifier {
  channel: Channel;
  /** International phone number without spaces (« +242066123456 ») or lower-case email. */
  value: string;
}

/** Why a code is requested — changes the refusals the server can return. */
export type Intent = 'sign-up' | 'sign-in' | 'invitation';

export interface CodeRequest {
  /** Anti-spam delay before a new code can be requested, in seconds. */
  resendIn: number;
}

export type Level = 'primary' | 'middle' | 'high' | 'university';

/** Mandatory teacher profile (US-P01), in three steps. */
export interface TeacherProfile {
  /** Family name — upper-case on class lists, a school convention. */
  lastName: string;
  firstName: string;
  subjects: string[];
  levels: Level[];
  /** The city only — never the exact address (RM-07). */
  city: string;
  /** Deduced from the phone number's calling code; asked only for an email sign-up. */
  country: CountryCode;
}

/** Parent invitation: 6-digit code, single use, 7 days (RM-12). */
export interface Invitation {
  code: string;
  student: string;
  classroom: string;
  school: string;
  teacher: string;
  subject: string;
}

/**
 * Parental consents a parent gives when accepting an invitation (RI-20): the
 * processing of the child's data, and their storage outside the country of the
 * parent–child link (hosting in Europe, ID-10).
 *
 * The values are Identity's document identifiers (glossary: `CHILD_DATA`,
 * `CROSS_BORDER_TRANSFER`), read in the invitation preview (`requiredConsents`)
 * and sent back in the acceptance (`consents`), and listed again by
 * `GET /v1/me/consents` for their withdrawal: kept verbatim, the HTTP adapter
 * passes them through instead of keeping a translation table in step.
 *
 * Which ones are asked is server data (`country_config.parental_consents`, union
 * of the parent's and the inviting teacher's countries): the app never works it
 * out, it shows what the server asks for. `TERMS` and `PRIVACY` (RI-16), also in
 * `requiredConsents` for an account to create, are not collected by any screen yet.
 */
export type ParentalConsent = 'CHILD_DATA' | 'CROSS_BORDER_TRANSFER';

/** Every parental consent, in the order the consent screen shows them. */
export const PARENTAL_CONSENTS: ParentalConsent[] = ['CHILD_DATA', 'CROSS_BORDER_TRANSFER'];

/** Accepting an invitation: the invitation, and the consents given for it (RI-20). */
export interface InvitationAcceptance {
  invitation: Invitation;
  consents: ParentalConsent[];
}

/** The parent's five alert settings (RM-16). */
export interface ParentAlerts {
  newGrade: boolean;
  gradeBelowPass: boolean;
  testAnnounced: boolean;
  reportCardAvailable: boolean;
  weeklySummary: boolean;
}

/**
 * The signed-in account and the space it shows. One member per active role, so
 * that the active role is always one the account holds — hence at least one:
 *
 *     { activeRole: 'teacher'; roles: { teacher: RoleStatus; parent?: RoleStatus } }
 *   | { activeRole: 'parent';  roles: { parent: RoleStatus; teacher?: RoleStatus } }
 *
 * A record keyed by role holds each role once, with its own step 2. A new space
 * is a new member of `Role`: this type follows. Helpers: `core/models/session.ts`.
 */
export type Session = { [A in Role]: SessionShowing<A> }[Role];

interface SessionShowing<A extends Role> {
  /** Account id. */
  id: string;
  identifier: Identifier;
  name?: string;
  /** The space shown — reopened at the next launch. */
  activeRole: A;
  /** The roles of the account (ID-02), each with its step 2. */
  roles: { [R in A]: RoleStatus } & { [R in Exclude<Role, A>]?: RoleStatus };
}
