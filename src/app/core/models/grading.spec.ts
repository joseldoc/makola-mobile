import { isBelowPassMark, passMark } from './grading';

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
