import { Level, ParentAlerts } from '@core/models/auth.model';
import { PeriodKind, periodSplit } from '@core/models/period';

export interface Option<T extends string = string> {
  value: T;
  /** Translation key of the label. */
  labelKey: string;
  detailKey?: string;
}

/** Subjects offered at sign-up — the admin reference data (US-AD04) will replace them. */
export const SUBJECTS: Option[] = [
  'maths',
  'physics',
  'biology',
  'french',
  'english',
  'history',
  'philosophy',
  'sport',
].map((value) => ({ value, labelKey: `subjects.${value}` }));

/** « Terms » / « Semesters », beside each level. */
const PERIODS_KEYS: Record<PeriodKind, string> = {
  term: 'levels.terms',
  semester: 'levels.semesters',
};

/** The period split follows the level (RM-02): read in `periodSplit`, not written again here. */
export const LEVELS: Option<Level>[] = (
  [
    ['primary', 'levels.primary'],
    ['middle', 'levels.middle'],
    ['high', 'levels.high'],
    ['university', 'levels.university'],
  ] as const
).map(([value, labelKey]) => ({
  value,
  labelKey,
  detailKey: PERIODS_KEYS[periodSplit(value).kind],
}));

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
  { key: 'weeklySummary', smsPerMonth: 4 },
];

/**
 * Where the flow goes once the contact is entered: the parental consents first
 * when the server asks for some (RI-20), else straight to the code.
 */
export type ContactNext = 'consents' | 'code';

export const DEFAULT_ALERTS: ParentAlerts = {
  newGrade: true,
  gradeBelowPass: false,
  testAnnounced: true,
  reportCardAvailable: true,
  weeklySummary: false,
};
