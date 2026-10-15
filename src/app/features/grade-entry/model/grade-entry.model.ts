/**
 * A grade cell holds one of three states (RM-15): a value, "absent" or
 * "not graded" — the last two are codes, never a zero. Values are stored with a
 * "." decimal point and shown with the separator of the interface language.
 */
export type GradeCode = 'absent' | 'ungraded';

export type GradeCell = string;

export const ABSENT: GradeCode = 'absent';
export const UNGRADED: GradeCode = 'ungraded';

export function isCode(cell: GradeCell): cell is GradeCode {
  return cell === ABSENT || cell === UNGRADED;
}
