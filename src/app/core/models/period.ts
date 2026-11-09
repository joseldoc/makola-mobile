import { Level } from './auth.model';

/**
 * How a school year is split (RM-02): terms from primary school to upper
 * secondary, semesters at university — at the MVP since 8 November 2026
 * (A-12, decided by the user: it reverses the v1.3 specification).
 */
export type PeriodKind = 'term' | 'semester';

export const PERIOD_KINDS: PeriodKind[] = ['term', 'semester'];

/** The split of a level: its kind of period and how many a school year holds. */
export interface PeriodSplit {
  kind: PeriodKind;
  count: number;
}

/**
 * RM-02, written once: the level of a class sets its periods. A new level is a
 * new entry here — never an `if` on a level elsewhere.
 */
const SPLITS: Record<Level, PeriodSplit> = {
  primary: { kind: 'term', count: 3 },
  middle: { kind: 'term', count: 3 },
  high: { kind: 'term', count: 3 },
  university: { kind: 'semester', count: 2 },
};

/** The period split of a level (RM-02). */
export function periodSplit(level: Level): PeriodSplit {
  return SPLITS[level];
}

/** How many periods of this kind a school year holds. */
function periodsPerYear(kind: PeriodKind): number {
  return Object.values(SPLITS).find((split) => split.kind === kind)!.count;
}

/** One period of a class: « Term 2 », « Semester 1 ». Data of the class, never a bare number. */
export interface Period {
  kind: PeriodKind;
  /** 1-based position in the school year. */
  n: number;
}

/** Period `n` of a class at `level`; refuses a period the level does not have. */
export function periodOf(level: Level, n: number): Period {
  const { kind, count } = periodSplit(level);
  if (!Number.isInteger(n) || n < 1 || n > count) {
    throw new RangeError(`A ${level} class has ${kind}s 1 to ${count}, not ${n}.`);
  }
  return { kind, n };
}

/**
 * The period after this one in the same school year — `null` after the last
 * (term 3, semester 2): the next one belongs to another school year, hence to
 * another class (A-16).
 */
export function nextPeriod(period: Period): Period | null {
  return period.n < periodsPerYear(period.kind) ? { kind: period.kind, n: period.n + 1 } : null;
}

/** The period before this one, `null` in the first. */
export function previousPeriod(period: Period): Period | null {
  return period.n > 1 ? { kind: period.kind, n: period.n - 1 } : null;
}

/**
 * The calendar of a class in a subject (RM-14), as the server will send it:
 * the current period and its closing, decided by the subject's teacher (A-20).
 */
export interface PeriodCalendar {
  period: Period;
  /** Closing date of the current period, ISO 8601. */
  periodCloses: string;
  /** Closing date of the previous period, ISO 8601 — absent in the first period. */
  previousPeriodCloses?: string;
}

/**
 * Translation key of a text that names the period: each such text has one
 * sentence per kind (`<base>.term`, `<base>.semester`), because the noun is not
 * a word that slots into a sentence in every language.
 */
export function periodKey(base: string, kind: PeriodKind): string {
  return `${base}.${kind}`;
}
