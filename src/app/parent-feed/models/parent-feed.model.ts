import { Message } from '@core/i18n/translate';

export type FeedItemType = 'newGrade' | 'gradeBelowPass' | 'testAnnounced' | 'reportCard';

/**
 * A grade carries the child's own grade (`value`) and, once the server sends it,
 * the class average of the same assignment (`classAverage`, RM-11 as amended on
 * 6 November 2026). The two are shown side by side, never compared: no rank, no
 * position, no colour tied to the class average. Absent until the server has it —
 * then nothing is shown, neither zero nor dash.
 */
export interface FeedGrade {
  kind: 'grade';
  value: number;
  classAverage?: number;
}

export type FeedValue = FeedGrade | { kind: 'date'; date: string } | { kind: 'text'; text: string };

export type FeedWhen = { kind: 'relative'; message: Message } | { kind: 'date'; date: string };

export interface FeedItem {
  type: FeedItemType;
  /** Assignment, subject, coefficient — school data, or a message when the interface builds it. */
  meta: string | Message;
  value: FeedValue;
  when: FeedWhen;
}
