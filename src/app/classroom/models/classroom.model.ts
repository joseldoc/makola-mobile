import { Level } from '@core/models/auth.model';
import { Scale } from '@core/models/grading';
import { PeriodCalendar } from '@core/models/period';

export interface Assignment {
  /** Entered by the teacher — data, not interface: never translated. */
  name: string;
  coefficient: number;
  scale: Scale;
  /** ISO date, formatted in the interface language. */
  date: string;
  /**
   * Average of this assignment over the class — shown to the teacher and to the
   * parent, never compared and never turned into a rank (RM-11 as amended on
   * 6 November 2026).
   */
  classAverage: number;
}

export interface Student {
  /** Technical id, in the address of the student's page (`/student/:classroomId/:studentId`). */
  id: string;
  name: string;
  /**
   * Average of the current period, out of `AVERAGE_SCALE` — in `danger` under
   * its pass mark (`isBelowPassMark`), never coloured against the class.
   */
  average: number;
}

/**
 * A class the teacher grades in one subject. Its level sets its periods (RM-02):
 * its period kind is a term up to upper secondary, a semester at university. A
 * university class still has students — the student role stays out of the MVP.
 */
export interface Classroom extends PeriodCalendar {
  id: string;
  /** Class, subject and school labels: school data, never translated. */
  name: string;
  subject: string;
  school: string;
  level: Level;
  assignments: Assignment[];
  students: Student[];
}
