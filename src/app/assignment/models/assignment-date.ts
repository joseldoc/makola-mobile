import { nextPeriod, periodKey, PeriodCalendar, previousPeriod } from '@core/models/period';

import { AssignmentDate } from './assignment.model';

/**
 * What the class calendar says about an assignment date (RM-14), for terms and
 * semesters alike. ISO dates compare as strings.
 *
 * - In a closed period: refused — a closed period never reopens through an entry.
 * - In the current period: accepted.
 * - After the current period closes: accepted with an alert, the assignment
 *   counting for the next period; after the last period of the year (term 3,
 *   semester 2) no period of this class follows, and the alert says so instead
 *   of naming one that does not exist.
 */
export function checkAssignmentDate(
  date: string,
  calendar: PeriodCalendar,
): Omit<AssignmentDate, 'date' | 'today'> {
  const { period, periodCloses, previousPeriodCloses } = calendar;
  const kind = period.kind;
  const previous = previousPeriod(period);

  if (previous && previousPeriodCloses && date <= previousPeriodCloses) {
    return {
      state: 'error',
      message: {
        key: periodKey('assignment.date.closed', kind),
        params: { n: previous.n, after: previousPeriodCloses },
      },
    };
  }
  if (date <= periodCloses) {
    return {
      state: 'idle',
      message: {
        key: periodKey('assignment.date.inPeriod', kind),
        params: { n: period.n, end: periodCloses },
      },
    };
  }
  const next = nextPeriod(period);
  return {
    state: 'warning',
    message: next
      ? {
          key: periodKey('assignment.date.afterClose', kind),
          params: { n: period.n, next: next.n },
        }
      : { key: periodKey('assignment.date.afterLastClose', kind), params: { n: period.n } },
  };
}
