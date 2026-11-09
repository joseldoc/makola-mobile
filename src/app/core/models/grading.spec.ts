import { isBelowPassMark, passMark, toAverageScale, weightedAverage } from './grading';

describe('Pass mark: half of the scale', () => {
  it('is 10 out of 20, 5 out of 10, 2.5 out of 5', () => {
    expect(passMark(20)).toBe(10);
    expect(passMark(10)).toBe(5);
    expect(passMark(5)).toBe(2.5);
  });

  it('a grade under it is below, the mark itself is not', () => {
    expect(isBelowPassMark(9.5, 20)).toBe(true);
    expect(isBelowPassMark(10, 20)).toBe(false);
    expect(isBelowPassMark(4.5, 10)).toBe(true);
    expect(isBelowPassMark(5, 10)).toBe(false);
    // 6 out of 10 passes: the old « below 10 » rule made it fail.
    expect(isBelowPassMark(6, 10)).toBe(false);
    expect(isBelowPassMark(2, 5)).toBe(true);
    expect(isBelowPassMark(2.5, 5)).toBe(false);
  });
});

describe('Grades read out of 20', () => {
  it('scales a grade of /10 and /5 to /20, keeps /20 as it is', () => {
    expect(toAverageScale(9.5, 10)).toBe(19);
    expect(toAverageScale(3.5, 5)).toBe(14);
    expect(toAverageScale(13.25, 20)).toBe(13.25);
  });
});

describe('Weighted average (RM-15: codes are left out by the caller)', () => {
  it('weights each grade by its coefficient, out of 20 whatever the scales', () => {
    // ILUNGA Marie, 4ème B, term 2: 9.5/10 coef 2, 17.5, 9, 18 coef 2.
    expect(
      weightedAverage([
        { value: 9.5, scale: 10, coefficient: 2 },
        { value: 17.5, scale: 20, coefficient: 1 },
        { value: 9, scale: 20, coefficient: 1 },
        { value: 18, scale: 20, coefficient: 2 },
      ]),
    ).toBe(16.75);
  });

  it('is null without any grade — never a zero', () => {
    expect(weightedAverage([])).toBeNull();
  });
});
