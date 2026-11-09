import { StudentRecord, StudentRecordQuery } from '../models/student-record.model';

export type StudentRecordErrorCode = 'unknown-record' | 'offline';

/**
 * Refusal of the grades server: the page turns `code` into a message that says
 * what to do (interface contract §7.6). `unknown-record`: no such student in this
 * class and subject — or none this account may read (A-19).
 */
export class StudentRecordError extends Error {
  constructor(readonly code: StudentRecordErrorCode) {
    super(code);
  }
}

/**
 * Contract of the grades server for a student's record (US-P08). Provided in
 * `app.config.ts`: today `MockStudentRecordApi`, tomorrow the HTTP
 * implementation — no screen changes. Rejects with a `StudentRecordError`.
 */
export abstract class StudentRecordApi {
  /** The student's assignments of the school year, with the class average of each. */
  abstract record(query: StudentRecordQuery): Promise<StudentRecord>;
}
