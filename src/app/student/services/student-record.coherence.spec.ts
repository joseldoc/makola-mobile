import { TestBed } from '@angular/core/testing';

import { formatDecimal } from '@core/i18n/format';

import { ClassroomStore } from '../../classroom/state/classroom.store';
import { ParentFeedStore } from '../../parent-feed/state/parent-feed.store';
import { StudentStore } from '../state/student.store';
import { MockStudentRecordApi } from './mock-student-record-api';
import { StudentRecordApi } from './student-record-api';

/**
 * The sample data lives in three stores and one mock server until the backend
 * exists: the classroom screen, the parent feed and a student's page must tell
 * the same story (the « 16.75 » of ILUNGA Marie was not her grades' average
 * before 8 November 2026).
 */
describe('Sample data — one story on every screen', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StudentStore, { provide: StudentRecordApi, useClass: MockStudentRecordApi }],
    });
  });

  it('each student’s average on the classroom screen is the average of their grades', async () => {
    const classrooms = TestBed.inject(ClassroomStore).classrooms();
    const student = TestBed.inject(StudentStore);
    for (const classroom of classrooms) {
      for (const s of classroom.students) {
        await student.load({ classroomId: classroom.id, studentId: s.id });
        expect(formatDecimal(student.average()!, 'en'), `${classroom.name} ${s.name}`).toBe(
          formatDecimal(s.average, 'en'),
        );
        expect(student.record()!.student).toBe(s.name);
      }
    }
  });

  it('the class averages of the current period are those of the classroom screen', async () => {
    const classrooms = TestBed.inject(ClassroomStore).classrooms();
    const student = TestBed.inject(StudentStore);
    for (const classroom of classrooms) {
      await student.load({ classroomId: classroom.id, studentId: classroom.students[0].id });
      const record = student.record()!;
      expect(record.classroom).toBe(classroom.name);
      expect(record.subject).toBe(classroom.subject);
      expect(record.period).toEqual(classroom.period);
      const shown = student
        .periodAssignments()
        .map(({ name, coefficient, scale, date, classAverage }) => ({
          name,
          coefficient,
          scale,
          date,
          classAverage,
        }));
      const sortedByDate = [...classroom.assignments].sort((a, b) => a.date.localeCompare(b.date));
      expect(shown).toEqual(sortedByDate);
    }
  });

  it('the parent feed’s card is the child’s page: 16.75 and 12.68', async () => {
    const feed = TestBed.inject(ParentFeedStore);
    const student = TestBed.inject(StudentStore);
    await student.load(feed.link());

    expect(student.record()!.student).toBe(feed.student());
    expect(student.record()!.subject).toBe(feed.subject());
    expect(student.record()!.period).toEqual(feed.period());
    expect(student.average()).toBe(feed.subjectAverage());
    expect(formatDecimal(student.classAverage()!, 'en')).toBe(
      formatDecimal(feed.classSubjectAverage()!, 'en'),
    );
    // The two grades the feed shows, with their class averages.
    const byName = (name: string) => student.record()!.assignments.find((a) => a.name === name)!;
    expect(byName('Contrôle n°2')).toMatchObject({ result: { value: 18 }, classAverage: 12.4 });
    expect(byName('Interrogation ch. 5')).toMatchObject({
      result: { value: 9 },
      classAverage: 11.8,
    });
  });
});
