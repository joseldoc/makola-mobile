import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';

import { provideI18n } from '@core/i18n';
import { PeriodCalendar } from '@core/models/period';
import { LanguageStore } from '@core/store/language/language.store';

import { checkAssignmentDate } from './assignment-date';

const TERM_2: PeriodCalendar = {
  period: { kind: 'term', n: 2 },
  periodCloses: '2026-03-27',
  previousPeriodCloses: '2026-01-06',
};
const SEMESTER_1: PeriodCalendar = {
  period: { kind: 'semester', n: 1 },
  periodCloses: '2026-01-30',
};
const SEMESTER_2: PeriodCalendar = {
  period: { kind: 'semester', n: 2 },
  periodCloses: '2026-06-12',
  previousPeriodCloses: '2026-02-06',
};

describe('Assignment date against the class calendar (RM-14)', () => {
  it('terms: accepted in the current one, flagged after its close, refused in a closed one', () => {
    expect(checkAssignmentDate('2026-03-19', TERM_2)).toEqual({
      state: 'idle',
      message: { key: 'assignment.date.inPeriod.term', params: { n: 2, end: '2026-03-27' } },
    });
    expect(checkAssignmentDate('2026-04-02', TERM_2)).toEqual({
      state: 'warning',
      message: { key: 'assignment.date.afterClose.term', params: { n: 2, next: 3 } },
    });
    expect(checkAssignmentDate('2026-01-04', TERM_2)).toEqual({
      state: 'error',
      message: { key: 'assignment.date.closed.term', params: { n: 1, after: '2026-01-06' } },
    });
  });

  it('semester 1: after its close the assignment counts for semester 2', () => {
    expect(checkAssignmentDate('2026-01-12', SEMESTER_1).message.key).toBe(
      'assignment.date.inPeriod.semester',
    );
    expect(checkAssignmentDate('2026-02-03', SEMESTER_1)).toEqual({
      state: 'warning',
      message: { key: 'assignment.date.afterClose.semester', params: { n: 1, next: 2 } },
    });
  });

  it('semester 2: no semester 3 — the alert says that none follows', () => {
    expect(checkAssignmentDate('2026-06-19', SEMESTER_2)).toEqual({
      state: 'warning',
      message: { key: 'assignment.date.afterLastClose.semester', params: { n: 2 } },
    });
    expect(checkAssignmentDate('2026-02-02', SEMESTER_2)).toEqual({
      state: 'error',
      message: { key: 'assignment.date.closed.semester', params: { n: 1, after: '2026-02-06' } },
    });
  });

  it('term 3: no term 4 either', () => {
    const term3: PeriodCalendar = { ...TERM_2, period: { kind: 'term', n: 3 } };
    expect(checkAssignmentDate('2026-04-02', term3).message.key).toBe(
      'assignment.date.afterLastClose.term',
    );
  });
});

describe('Assignment date messages, for a semester, in both languages', () => {
  const read = (date: string, calendar: PeriodCalendar) => {
    const { key, params } = checkAssignmentDate(date, calendar).message;
    return TestBed.inject(TranslocoService).translate(key, params).replace(/ /g, ' ');
  };

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideI18n()] });
    await TestBed.inject(LanguageStore).init();
  });

  afterEach(() => localStorage.clear());

  it('en', () => {
    expect(read('2026-02-03', SEMESTER_1)).toBe(
      'After semester 1 closes: this assignment will count for semester 2.',
    );
    expect(read('2026-06-19', SEMESTER_2)).toBe(
      'After semester 2 closes, the last of the academic year: no semester of this class follows. Check the date.',
    );
    expect(read('2026-06-19', SEMESTER_2)).not.toMatch(/semester 3|term/i);
  });

  it('fr', async () => {
    await TestBed.inject(LanguageStore).setLanguage('fr');
    expect(read('2026-02-03', SEMESTER_1)).toBe(
      'Après la clôture du semestre 1 : ce devoir comptera pour le semestre 2.',
    );
    expect(read('2026-06-19', SEMESTER_2)).toBe(
      "Après la clôture du semestre 2, le dernier de l'année universitaire : aucun semestre de cette classe ne suit. Vérifiez la date.",
    );
    expect(read('2026-02-02', SEMESTER_2)).toContain('Le semestre 1 est clôturé.');
  });
});
