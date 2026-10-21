import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { FeedItem } from './model';

/** Taken from ui_kits/app/FilParentScreen.jsx. */
const FEED: FeedItem[] = [
  {
    type: 'newGrade',
    meta: 'Contrôle n°2 · Maths · coef 2',
    value: { kind: 'grade', value: 18 },
    when: { kind: 'relative', message: { key: 'parentFeed.when.minutesAgo', params: { count: 2 } } }
  },
  {
    type: 'gradeBelowPass',
    meta: 'Interrogation ch. 5 · Maths',
    value: { kind: 'grade', value: 9 },
    when: { kind: 'date', date: '2026-03-11' }
  },
  {
    type: 'testAnnounced',
    meta: 'Maths · ch. 6 Angles inscrits',
    value: { kind: 'date', date: '2026-03-26' },
    when: { kind: 'relative', message: { key: 'parentFeed.when.yesterdayAt', params: { time: '17:41' } } }
  },
  {
    type: 'reportCard',
    meta: { key: 'parentFeed.reportCardMeta', params: { term: 1, subject: 'Mathématiques' } },
    value: { kind: 'text', text: 'PDF' },
    when: { kind: 'date', date: '2025-12-12' }
  }
];

interface ParentFeedState {
  student: string;
  initials: string;
  classroom: string;
  subject: string;
  subjectAverage: number;
  term: number;
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
  term: 2,
  feed: FEED,
  weeklySummary: true,
  scrolled: false
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
    }
  }))
);
