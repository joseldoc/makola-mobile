import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { Period } from '@core/models/period';

import { FeedItem } from '../models/parent-feed.model';

/** Taken from ui_kits/app/FilParentScreen.jsx. */
const FEED: FeedItem[] = [
  {
    type: 'newGrade',
    meta: 'Contrôle n°2 · Maths · coef 2',
    // Same assignment, same class as the teacher's classroom screen: same class average.
    value: { kind: 'grade', value: 18, scale: 20, classAverage: 12.4 },
    when: {
      kind: 'relative',
      message: { key: 'parentFeed.when.minutesAgo', params: { count: 2 } },
    },
  },
  {
    type: 'gradeBelowPass',
    meta: 'Interrogation ch. 5 · Maths',
    value: { kind: 'grade', value: 9, scale: 20, classAverage: 11.8 },
    when: { kind: 'date', date: '2026-03-11' },
  },
  {
    type: 'testAnnounced',
    meta: 'Maths · ch. 6 Angles inscrits',
    value: { kind: 'date', date: '2026-03-26' },
    when: {
      kind: 'relative',
      message: { key: 'parentFeed.when.yesterdayAt', params: { time: '17:41' } },
    },
  },
  {
    type: 'reportCard',
    meta: {
      key: 'parentFeed.reportCardMeta.term',
      params: { n: 1, subject: 'Mathématiques' },
    },
    value: { kind: 'text', text: 'PDF' },
    when: { kind: 'date', date: '2025-12-12' },
  },
];

interface ParentFeedState {
  /**
   * The link shown (A-19): this child, in the class and subject of the teacher
   * who invited the parent — the only record the « Grades » page reads.
   */
  link: { classroomId: string; studentId: string };
  student: string;
  initials: string;
  classroom: string;
  subject: string;
  /** The child's own average in the subject, this period: the card's main value. */
  subjectAverage: number;
  /**
   * Average of the class in the same subject and period (RM-11 as amended on
   * 7 November 2026), shown beside the child's average, never compared to it.
   * `undefined` until the server sends it: the card then shows nothing more.
   * A key always present (not `?:`), so that the store exposes its signal.
   */
  classSubjectAverage: number | undefined;
  /** The child's class period — a term, or a semester at university (RM-02). */
  period: Period;
  /**
   * Closing date of the period in this subject (RM-14, decided by its teacher, A-20),
   * ISO 8601 — the period card's only line: a fact, never a judgement of the child.
   */
  periodCloses: string;
  feed: FeedItem[];
  weeklySummary: boolean;
  scrolled: boolean;
}

const initialState: ParentFeedState = {
  link: { classroomId: '4b-maths', studentId: 'ilunga-marie' },
  student: 'ILUNGA Marie',
  initials: 'IM',
  classroom: '4ème B · Lycée Chaminade',
  subject: 'Maths',
  // Her coefficient-weighted average of term 2, as on the classroom screen and on
  // her page: (19 × 2 + 17.5 + 9 + 18 × 2) / 6, Interrogation ch. 4 (9.5/10) read out of 20.
  subjectAverage: 16.75,
  // Same class, subject and term as the teacher's classroom screen: the
  // coefficient-weighted mean of its four assignments' class averages, out of 20 —
  // (6.35 × 2 × 2 + 14.1 + 11.8 + 12.4 × 2) / 6 = 12.683, shown to two decimals.
  classSubjectAverage: 12.68,
  period: { kind: 'term', n: 2 },
  // Same class and term as the teacher's screens (classroom, new assignment).
  periodCloses: '2026-03-27',
  feed: FEED,
  weeklySummary: true,
  scrolled: false,
};

export const ParentFeedStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setWeeklySummary(enabled: boolean): void {
      patchState(store, { weeklySummary: enabled });
    },
    setScrolled(scrolled: boolean): void {
      patchState(store, { scrolled });
    },
  })),
);
