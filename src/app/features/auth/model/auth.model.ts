import { Level, ParentAlerts } from '@core/auth/auth.model';

export interface Option<T extends string = string> {
  value: T;
  /** Translation key of the label. */
  labelKey: string;
  detailKey?: string;
}

/** Subjects offered at sign-up — the admin reference data (US-AD04) will replace them. */
export const SUBJECTS: Option[] = ['maths', 'physics', 'biology', 'french', 'english', 'history', 'philosophy', 'sport'].map(
  (value) => ({ value, labelKey: `subjects.${value}` })
);

/** The period split follows the level (RM-02). */
export const LEVELS: Option<Level>[] = [
  { value: 'primary', labelKey: 'levels.primary', detailKey: 'levels.terms' },
  { value: 'middle', labelKey: 'levels.middle', detailKey: 'levels.terms' },
  { value: 'high', labelKey: 'levels.high', detailKey: 'levels.terms' },
  { value: 'university', labelKey: 'levels.university', detailKey: 'levels.semesters' }
];

export interface AlertOption {
  key: keyof ParentAlerts;
  /** SMS triggered per month, on average — announced before confirming (RM-16). */
  smsPerMonth: number;
}

/** The five settings (RM-16). Labels: `auth.alerts.options.<key>.label | detail`. */
export const ALERT_OPTIONS: AlertOption[] = [
  { key: 'newGrade', smsPerMonth: 6 },
  { key: 'gradeBelowPass', smsPerMonth: 2 },
  { key: 'testAnnounced', smsPerMonth: 3 },
  { key: 'reportCardAvailable', smsPerMonth: 0.34 },
  { key: 'weeklySummary', smsPerMonth: 4 }
];

export const DEFAULT_ALERTS: ParentAlerts = {
  newGrade: true,
  gradeBelowPass: false,
  testAnnounced: true,
  reportCardAvailable: true,
  weeklySummary: false
};
