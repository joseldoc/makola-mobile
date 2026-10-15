import { Message } from '@core/i18n/translate';

export type FeedItemType = 'newGrade' | 'gradeBelowPass' | 'testAnnounced' | 'reportCard';

export type FeedValue = { kind: 'grade'; value: number } | { kind: 'date'; date: string } | { kind: 'text'; text: string };

export type FeedWhen = { kind: 'relative'; message: Message } | { kind: 'date'; date: string };

export interface FeedItem {
  type: FeedItemType;
  /** Assignment, subject, coefficient — school data, or a message when the interface builds it. */
  meta: string | Message;
  value: FeedValue;
  when: FeedWhen;
}
