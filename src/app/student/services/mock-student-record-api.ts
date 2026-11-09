import { Injectable } from '@angular/core';

import { Level } from '@core/models/auth.model';
import { Scale } from '@core/models/grading';
import { periodOf } from '@core/models/period';

import { ABSENT, GradeCode, UNGRADED } from '../../grade-entry/models/grade-entry.model';
import {
  AssignmentResult,
  RecordedAssignment,
  StudentRecord,
  StudentRecordQuery,
} from '../models/student-record.model';
import { StudentRecordApi, StudentRecordError } from './student-record-api';

/** A grade on the assignment's scale, or one of the two codes (RM-15). */
type SampleCell = number | GradeCode;

interface SampleAssignment {
  name: string;
  date: string;
  coefficient: number;
  scale: Scale;
  /** 1-based period of the class. */
  period: number;
  /** Every student of the class, by id: the class average is computed from them. */
  grades: Record<string, SampleCell>;
}

interface SampleClassroom {
  name: string;
  subject: string;
  level: Level;
  /** The current period of the class. */
  period: number;
  students: Record<string, string>;
  /** Chronological. */
  assignments: SampleAssignment[];
}

/**
 * The grades of the two sample classes, for the whole school year so far —
 * the same classes, students and assignments as `ClassroomStore`, the parent
 * feed and the grade entry. The current period's class averages and students'
 * averages are those the classroom screen shows: `student-record.coherence.spec.ts`
 * checks it. Names are school data: never translated.
 */
const CLASSROOMS: Record<string, SampleClassroom> = {
  '4b-maths': {
    name: '4ème B',
    subject: 'Maths',
    level: 'high',
    period: 2,
    students: {
      'ilunga-marie': 'ILUNGA Marie',
      'moukala-chris': 'MOUKALA Chris',
      'ngoma-divine': 'NGOMA Divine',
      'obambi-junior': 'OBAMBI Junior',
      'samba-rose': 'SAMBA Rose',
      'tati-gloire': 'TATI Gloire',
    },
    assignments: [
      // Term 1, closed on 6 January 2026.
      {
        name: 'Interrogation ch. 1',
        date: '2025-10-10',
        coefficient: 1,
        scale: 20,
        period: 1,
        grades: {
          'ilunga-marie': 12.5,
          'moukala-chris': 8,
          'ngoma-divine': 12,
          'obambi-junior': 10.5,
          'samba-rose': 14,
          'tati-gloire': 9,
        },
      },
      {
        name: 'Interrogation ch. 2',
        date: '2025-11-07',
        coefficient: 1,
        scale: 10,
        period: 1,
        grades: {
          'ilunga-marie': ABSENT,
          'moukala-chris': 4.5,
          'ngoma-divine': 6.5,
          'obambi-junior': 5.5,
          'samba-rose': 8,
          'tati-gloire': 4,
        },
      },
      {
        name: 'Contrôle n°1',
        date: '2025-11-28',
        coefficient: 2,
        scale: 20,
        period: 1,
        grades: {
          'ilunga-marie': 14,
          'moukala-chris': 9,
          'ngoma-divine': 13,
          'obambi-junior': 11,
          'samba-rose': 16.5,
          'tati-gloire': 8.5,
        },
      },
      {
        name: 'Interrogation ch. 3',
        date: '2025-12-12',
        coefficient: 1,
        scale: 20,
        period: 1,
        grades: {
          'ilunga-marie': UNGRADED,
          'moukala-chris': 10,
          'ngoma-divine': 14,
          'obambi-junior': 11.5,
          'samba-rose': 16,
          'tati-gloire': 9.5,
        },
      },
      // Term 2, the current one.
      {
        name: 'Interrogation ch. 4',
        date: '2026-01-23',
        coefficient: 2,
        scale: 10,
        period: 2,
        grades: {
          'ilunga-marie': 9.5,
          'moukala-chris': 4.5,
          'ngoma-divine': 6.75,
          'obambi-junior': ABSENT,
          'samba-rose': 7.5,
          'tati-gloire': 3.5,
        },
      },
      {
        name: 'Devoir maison n°1',
        date: '2026-02-28',
        coefficient: 1,
        scale: 20,
        period: 2,
        grades: {
          'ilunga-marie': 17.5,
          'moukala-chris': UNGRADED,
          'ngoma-divine': 13.5,
          'obambi-junior': 11.25,
          'samba-rose': 15.75,
          'tati-gloire': 12.5,
        },
      },
      {
        name: 'Interrogation ch. 5',
        date: '2026-03-06',
        coefficient: 1,
        scale: 20,
        period: 2,
        grades: {
          'ilunga-marie': 9,
          'moukala-chris': 9.25,
          'ngoma-divine': 13.5,
          'obambi-junior': 11.25,
          'samba-rose': 16,
          'tati-gloire': ABSENT,
        },
      },
      {
        name: 'Contrôle n°2',
        date: '2026-03-12',
        coefficient: 2,
        scale: 20,
        period: 2,
        grades: {
          'ilunga-marie': 18,
          'moukala-chris': 9.5,
          'ngoma-divine': ABSENT,
          'obambi-junior': 10.75,
          'samba-rose': 15.25,
          'tati-gloire': 8.5,
        },
      },
    ],
  },
  'l1-maths': {
    name: 'L1 Mathématiques',
    subject: 'Analyse',
    level: 'university',
    period: 2,
    students: {
      'banzouzi-grace': 'BANZOUZI Grâce',
      'elenga-fortune': 'ELENGA Fortuné',
      'kimbembe-sarah': 'KIMBEMBE Sarah',
      'makaya-prince': 'MAKAYA Prince',
      'nkouka-ornella': 'NKOUKA Ornella',
    },
    assignments: [
      // Semester 1, closed on 6 February 2026.
      {
        name: 'TD n°1',
        date: '2025-10-17',
        coefficient: 1,
        scale: 10,
        period: 1,
        grades: {
          'banzouzi-grace': 6.5,
          'elenga-fortune': 4.5,
          'kimbembe-sarah': 6,
          'makaya-prince': 5,
          'nkouka-ornella': 7.5,
        },
      },
      {
        name: 'TD n°2',
        date: '2025-11-14',
        coefficient: 1,
        scale: 10,
        period: 1,
        grades: {
          'banzouzi-grace': 7,
          'elenga-fortune': UNGRADED,
          'kimbembe-sarah': 6,
          'makaya-prince': ABSENT,
          'nkouka-ornella': 8,
        },
      },
      {
        name: 'Examen n°1',
        date: '2026-01-23',
        coefficient: 3,
        scale: 20,
        period: 1,
        grades: {
          'banzouzi-grace': 13.5,
          'elenga-fortune': 10,
          'kimbembe-sarah': 11.5,
          'makaya-prince': 8.5,
          'nkouka-ornella': 15,
        },
      },
      // Semester 2, the current one.
      {
        name: 'TD n°3',
        date: '2026-02-20',
        coefficient: 1,
        scale: 10,
        period: 2,
        grades: {
          'banzouzi-grace': ABSENT,
          'elenga-fortune': 5.25,
          'kimbembe-sarah': 6.25,
          'makaya-prince': 4,
          'nkouka-ornella': 7.5,
        },
      },
      {
        name: 'TD n°4',
        date: '2026-03-04',
        coefficient: 1,
        scale: 10,
        period: 2,
        grades: {
          'banzouzi-grace': 7.25,
          'elenga-fortune': 5.25,
          'kimbembe-sarah': 5.75,
          'makaya-prince': 4,
          'nkouka-ornella': 8.75,
        },
      },
      {
        name: 'Partiel n°1',
        date: '2026-03-10',
        coefficient: 3,
        scale: 20,
        period: 2,
        grades: {
          'banzouzi-grace': 12.75,
          'elenga-fortune': 9,
          'kimbembe-sarah': 11,
          'makaya-prince': 7.75,
          'nkouka-ornella': 14,
        },
      },
    ],
  },
};

/** The server's class average of an assignment: the mean of the students present, to 2 decimals. */
function classAverage(grades: Record<string, SampleCell>): number | undefined {
  const values = Object.values(grades).filter((g): g is number => typeof g === 'number');
  if (!values.length) return undefined;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function result(cell: SampleCell): AssignmentResult {
  return typeof cell === 'number' ? { kind: 'grade', value: cell } : { kind: cell };
}

/**
 * Sample grades server until the backend exists — swap for the HTTP
 * implementation in `app.config.ts`, no screen changes. The record of a
 * student who is not in the class is refused, like the server will.
 */
@Injectable()
export class MockStudentRecordApi extends StudentRecordApi {
  async record({ classroomId, studentId }: StudentRecordQuery): Promise<StudentRecord> {
    const classroom = CLASSROOMS[classroomId];
    const student = classroom?.students[studentId];
    if (!classroom || !student) throw new StudentRecordError('unknown-record');
    const assignments = classroom.assignments.map<RecordedAssignment>((a) => ({
      name: a.name,
      date: a.date,
      coefficient: a.coefficient,
      scale: a.scale,
      period: periodOf(classroom.level, a.period),
      classAverage: classAverage(a.grades),
      result: result(a.grades[studentId]),
    }));
    return {
      student,
      classroom: classroom.name,
      subject: classroom.subject,
      period: periodOf(classroom.level, classroom.period),
      assignments,
    };
  }
}
