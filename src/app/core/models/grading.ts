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
