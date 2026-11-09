import { Scale } from '@core/models/grading';
import { Period } from '@core/models/period';

import { GradeCode } from '../../grade-entry/models/grade-entry.model';

/**
 * What a student got on an assignment — one of the three states of a grade cell
 * (RM-15): a value on the assignment's scale, « absent » or « not graded ». The
 * two codes are never a zero and never enter an average.
 */
export type AssignmentResult = { kind: 'grade'; value: number } | { kind: GradeCode };

/** One assignment of the school year, as the student's record holds it. */
export interface RecordedAssignment {
  /** Entered by the teacher — data, not interface: never translated. */
  name: string;
  /** ISO date, formatted in the interface language. */
  date: string;
  coefficient: number;
  scale: Scale;
  /** The period of the class it belongs to (RM-02, RM-14). */
  period: Period;
  /**
   * Average of the class on this assignment, on its own scale (RM-11 as amended
   * on 6 November 2026) — shown beside the student's result, never compared to
   * it. Absent until the server has it.
   */
  classAverage?: number;
  result: AssignmentResult;
}

/**
 * A student's record in one class and one subject — the only subject of the
 * teacher who invited a parent (A-19): a parent never reads another one.
 */
export interface StudentRecord {
  /** Student, class and subject labels: school data, never translated. */
  student: string;
  classroom: string;
  subject: string;
  /** The period shown: the current one of the class (RM-02). */
  period: Period;
  /** Every assignment of the school year so far, in chronological order. */
  assignments: RecordedAssignment[];
}

/**
 * Which record to read: a class in one subject (`4b-maths`) and a student. A
 * teacher's comes from the address, a parent's from their link (A-19).
 */
export interface StudentRecordQuery {
  classroomId: string;
  studentId: string;
}
