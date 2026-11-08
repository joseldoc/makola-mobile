import { Level } from './auth.model';
import { nextPeriod, periodOf, periodSplit, previousPeriod } from './period';

describe('Periods follow the level of the class (RM-02)', () => {
  it.each<[Level, string, number]>([
    ['primary', 'term', 3],
    ['middle', 'term', 3],
    ['high', 'term', 3],
    ['university', 'semester', 2],
  ])('%s: %ss, %i a year', (level, kind, count) => {
    expect(periodSplit(level)).toEqual({ kind, count });
  });

  it('builds a period of the class from its level', () => {
    expect(periodOf('high', 2)).toEqual({ kind: 'term', n: 2 });
    expect(periodOf('university', 1)).toEqual({ kind: 'semester', n: 1 });
  });

  it('refuses a period the level does not have', () => {
    expect(() => periodOf('university', 3)).toThrow(RangeError);
    expect(() => periodOf('primary', 0)).toThrow(RangeError);
  });

  it('knows the next period, and that none follows the last one of the year', () => {
    expect(nextPeriod({ kind: 'term', n: 2 })).toEqual({ kind: 'term', n: 3 });
    expect(nextPeriod({ kind: 'term', n: 3 })).toBeNull();
    expect(nextPeriod({ kind: 'semester', n: 1 })).toEqual({ kind: 'semester', n: 2 });
    expect(nextPeriod({ kind: 'semester', n: 2 })).toBeNull();
  });

  it('knows the previous period, none before the first', () => {
    expect(previousPeriod({ kind: 'semester', n: 2 })).toEqual({ kind: 'semester', n: 1 });
    expect(previousPeriod({ kind: 'term', n: 1 })).toBeNull();
  });
});
