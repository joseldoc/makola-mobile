import { CountryCode } from './country';

/** The two roles of the MVP (functional spec §8). */
export type Role = 'teacher' | 'parent';

export const ROLES: Role[] = ['teacher', 'parent'];

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

/** The parent's five alert settings (RM-16). */
export interface ParentAlerts {
  newGrade: boolean;
  gradeBelowPass: boolean;
  testAnnounced: boolean;
  reportCardAvailable: boolean;
  weeklySummary: boolean;
}

export interface Session {
  id: string;
  role: Role;
  identifier: Identifier;
  name?: string;
  /** False until step 2 (teacher profile, parent alerts) is done. */
  profileComplete: boolean;
}
