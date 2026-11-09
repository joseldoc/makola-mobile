/** Grading scales of an assignment (RM-13). */
export type Scale = 20 | 10 | 5;

export const SCALES: Scale[] = [20, 10, 5];

/**
 * Averages are reported out of 20, whatever the scales of the assignments they
 * gather (the school convention in Congo and on the report card).
 */
export const AVERAGE_SCALE: Scale = 20;

/**
 * The pass mark of a scale: half of it — 10 out of 20, 5 out of 10 (decision of
 * 8 November 2026), and 2.5 out of 5, the same rule deduced for the third scale.
 * The only place that says so: the alert, the parent feed, the class and the
 * grade entry screens all read it here.
 */
export function passMark(scale: Scale): number {
  return scale / 2;
}

/** A grade or an average under the pass mark of its scale — shown in `danger`. */
export function isBelowPassMark(value: number, scale: Scale): boolean {
  return value < passMark(scale);
}

/** A grade read out of `AVERAGE_SCALE`: 7 out of 10 reads 14 out of 20. */
export function toAverageScale(value: number, scale: Scale): number {
  return (value * AVERAGE_SCALE) / scale;
}

/** One grade of an average: its value on its own scale, and its assignment's coefficient. */
export interface WeightedGrade {
  value: number;
  scale: Scale;
  coefficient: number;
}

/**
 * The coefficient-weighted average of grades, out of `AVERAGE_SCALE` — `null`
 * without any. « Absent » and « not graded » are never given to it: they are not
 * zeros and do not count (RM-15); the caller leaves them out.
 */
export function weightedAverage(grades: readonly WeightedGrade[]): number | null {
  let sum = 0;
  let weight = 0;
  for (const { value, scale, coefficient } of grades) {
    sum += toAverageScale(value, scale) * coefficient;
    weight += coefficient;
  }
  return weight > 0 ? sum / weight : null;
}
