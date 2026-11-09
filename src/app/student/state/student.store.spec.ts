import { TestBed } from '@angular/core/testing';

import { StudentRecord, StudentRecordQuery } from '../models/student-record.model';
import { MockStudentRecordApi } from '../services/mock-student-record-api';
import { StudentRecordApi, StudentRecordError } from '../services/student-record-api';
import { StudentStore } from './student.store';

const marie: StudentRecordQuery = { classroomId: '4b-maths', studentId: 'ilunga-marie' };

function setup(api: Partial<StudentRecordApi> = new MockStudentRecordApi()) {
  TestBed.configureTestingModule({
    providers: [StudentStore, { provide: StudentRecordApi, useValue: api }],
  });
  return TestBed.inject(StudentStore);
}

describe('StudentStore — a student’s record (US-P08)', () => {
  it('reads every grade out of 20: 9.5 out of 10 is 19', async () => {
    const store = setup();
    await store.load(marie);

    const ch4 = store.curve().find((c) => c.assignment.name === 'Interrogation ch. 4')!;
    expect(ch4.grade).toBe(19);
    // The class average of a /10 assignment is brought to 20 the same way.
    expect(ch4.classAverage).toBeCloseTo(12.7, 10);
    expect(store.curve().find((c) => c.assignment.name === 'Contrôle n°2')!.grade).toBe(18);
  });

  it('keeps absent and not graded as codes, never a zero (RM-15)', async () => {
    const store = setup();
    await store.load(marie);

    const codes = store.curve().filter((c) => c.code !== null);
    expect(codes.map((c) => [c.assignment.name, c.code, c.grade])).toEqual([
      ['Interrogation ch. 2', 'absent', null],
      ['Interrogation ch. 3', 'ungraded', null],
    ]);
  });

  it('averages the current period only, weighted by coefficient: 16.75 for ILUNGA Marie', async () => {
    const store = setup();
    await store.load(marie);

    expect(store.periodAssignments().map((a) => a.name)).toEqual([
      'Interrogation ch. 4',
      'Devoir maison n°1',
      'Interrogation ch. 5',
      'Contrôle n°2',
    ]);
    expect(store.average()).toBe(16.75);
    // The class average of the subject, as on the parent's card: 12.68 once shown.
    expect(store.classAverage()!.toFixed(2)).toBe('12.68');
  });

  it('leaves an absence out of the average instead of counting a zero', async () => {
    // OBAMBI Junior was absent for Interrogation ch. 4 (coef 2): (11.25 + 11.25 + 10.75 × 2) / 4.
    const store = setup();
    await store.load({ classroomId: '4b-maths', studentId: 'obambi-junior' });

    expect(store.average()).toBe(11);
  });

  it('has no average without a grade in the period — null, not zero', async () => {
    const record: StudentRecord = {
      student: 'X',
      classroom: '4ème B',
      subject: 'Maths',
      period: { kind: 'term', n: 2 },
      assignments: [
        {
          name: 'Contrôle n°2',
          date: '2026-03-12',
          coefficient: 2,
          scale: 20,
          period: { kind: 'term', n: 2 },
          result: { kind: 'absent' },
        },
      ],
    };
    const store = setup({ record: () => Promise.resolve(record) });
    await store.load(marie);

    expect(store.average()).toBeNull();
    expect(store.classAverage()).toBeNull();
  });

  it('reads a university class by semesters (RM-02)', async () => {
    const store = setup();
    await store.load({ classroomId: 'l1-maths', studentId: 'banzouzi-grace' });

    expect(store.record()!.period).toEqual({ kind: 'semester', n: 2 });
    // Absent for TD n°3: (7.25 × 2 + 12.75 × 3) / 4.
    expect(store.average()).toBe(13.1875);
  });

  it('turns a refusal into an error state, without a record', async () => {
    const store = setup();
    await store.load({ classroomId: '4b-maths', studentId: 'nobody' });

    expect(store.loading()).toBe(false);
    expect(store.record()).toBeNull();
    expect(store.error()).toBe('unknown-record');
  });

  it('drops the answer of an earlier query', async () => {
    let release!: (r: StudentRecord) => void;
    const slow = new Promise<StudentRecord>((resolve) => (release = resolve));
    const mock = new MockStudentRecordApi();
    const store = setup({
      record: (q) => (q.studentId === 'ilunga-marie' ? slow : mock.record(q)),
    });

    const first = store.load(marie);
    await store.load({ classroomId: '4b-maths', studentId: 'samba-rose' });
    release(await mock.record(marie));
    await first;

    expect(store.record()!.student).toBe('SAMBA Rose');
  });

  it('a refusal of the contract is a StudentRecordError', async () => {
    await expect(
      new MockStudentRecordApi().record({ classroomId: 'nowhere', studentId: 'ilunga-marie' }),
    ).rejects.toBeInstanceOf(StudentRecordError);
  });
});
