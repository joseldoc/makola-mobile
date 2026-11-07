import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { FeedItem } from '../models/parent-feed.model';

/** Taken from ui_kits/app/FilParentScreen.jsx. */
const FEED: FeedItem[] = [
  {
    type: 'newGrade',
    meta: 'Contrôle n°2 · Maths · coef 2',
    // Same assignment, same class as the teacher's classroom screen: same class average.
    value: { kind: 'grade', value: 18, classAverage: 12.4 },
    when: {
      kind: 'relative',
      message: { key: 'parentFeed.when.minutesAgo', params: { count: 2 } },
    },
  },
  {
    type: 'gradeBelowPass',
    meta: 'Interrogation ch. 5 · Maths',
    value: { kind: 'grade', value: 9, classAverage: 11.8 },
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
    meta: { key: 'parentFeed.reportCardMeta', params: { term: 1, subject: 'Mathématiques' } },
    value: { kind: 'text', text: 'PDF' },
    when: { kind: 'date', date: '2025-12-12' },
  },
];

interface ParentFeedState {
  student: string;
  initials: string;
  classroom: string;
  subject: string;
  /** The child's own average in the subject, this term: the card's main value. */
  subjectAverage: number;
  /**
   * Average of the class in the same subject and term (RM-11 as amended on
   * 7 November 2026), shown beside the child's average, never compared to it.
   * `undefined` until the server sends it: the card then shows nothing more.
   * A key always present (not `?:`), so that the store exposes its signal.
   */
  classSubjectAverage: number | undefined;
  term: number;
  /**
   * Closing date of the term in this subject (RM-14, decided by its teacher, A-20),
   * ISO 8601 — the term card's only line: a fact, never a judgement of the child.
   */
  termCloses: string;
  feed: FeedItem[];
  weeklySummary: boolean;
  scrolled: boolean;
}

const initialState: ParentFeedState = {
  student: 'ILUNGA Marie',
  initials: 'IM',
  classroom: '4ème B · Lycée Chaminade',
  subject: 'Maths',
  subjectAverage: 16.75,
  // Same class, subject and term as the teacher's classroom screen: the
  // coefficient-weighted mean of its three assignments' class averages —
  // (12.4 × 2 + 11.8 × 1 + 14.1 × 1) / 4 = 12.675, shown to two decimals.
  classSubjectAverage: 12.68,
  term: 2,
  // Same class and term as the teacher's screens (classroom, new assignment).
  termCloses: '2026-03-27',
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
