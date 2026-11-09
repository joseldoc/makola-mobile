import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { toAverageScale, weightedAverage, WeightedGrade } from '@core/models/grading';
import { Period } from '@core/models/period';

import {
  RecordedAssignment,
  StudentRecord,
  StudentRecordQuery,
} from '../models/student-record.model';
import {
  StudentRecordApi,
  StudentRecordError,
  StudentRecordErrorCode,
} from '../services/student-record-api';

/**
 * One assignment on the curve, out of 20 (`AVERAGE_SCALE`) so that /20, /10 and
 * /5 read on one axis. `grade` is `null` for « absent » and « not graded »: no
 * point, never a zero (RM-15) — `code` says which.
 */
export interface CurveEntry {
  assignment: RecordedAssignment;
  grade: number | null;
  code: 'absent' | 'ungraded' | null;
  classAverage: number | null;
}

interface StudentState {
  record: StudentRecord | null;
  loading: boolean;
  error: StudentRecordErrorCode | null;
}

const initialState: StudentState = { record: null, loading: false, error: null };

const samePeriod = (a: Period, b: Period) => a.kind === b.kind && a.n === b.n;

/**
 * State of a student's page (US-P08): one record, read only. Provided by the
 * page, so each visit starts empty — never the previous student's grades.
 */
export const StudentStore = signalStore(
  withState(initialState),
  withComputed(({ record }) => ({
    /** Every assignment of the year, chronological, each read out of 20. */
    curve: computed<CurveEntry[]>(() =>
      (record()?.assignments ?? []).map((assignment) => {
        const { result, scale, classAverage } = assignment;
        return {
          assignment,
          grade: result.kind === 'grade' ? toAverageScale(result.value, scale) : null,
          code: result.kind === 'grade' ? null : result.kind,
          classAverage: classAverage === undefined ? null : toAverageScale(classAverage, scale),
        };
      }),
    ),
    /** The assignments of the period shown — the current one of the class. */
    periodAssignments: computed(() => {
      const r = record();
      return r ? r.assignments.filter((a) => samePeriod(a.period, r.period)) : [];
    }),
  })),
  withComputed(({ periodAssignments }) => ({
    /**
     * The student's average over the period, coefficient-weighted, out of 20 —
     * « absent » and « not graded » left out (RM-15). `null` without a grade.
     */
    average: computed(() =>
      weightedAverage(
        periodAssignments().flatMap<WeightedGrade>(({ result, scale, coefficient }) =>
          result.kind === 'grade' ? [{ value: result.value, scale, coefficient }] : [],
        ),
      ),
    ),
    /**
     * The class average in the subject over the period: the coefficient-weighted
     * mean of its assignments' class averages, as on the parent's subject card.
     * Shown beside the student's, never compared to it (RM-11 as amended).
     */
    classAverage: computed(() =>
      weightedAverage(
        periodAssignments().flatMap<WeightedGrade>(({ classAverage, scale, coefficient }) =>
          classAverage === undefined ? [] : [{ value: classAverage, scale, coefficient }],
        ),
      ),
    ),
  })),
  withMethods((store, api = inject(StudentRecordApi)) => {
    /** The query being read: an answer for an earlier one is dropped. */
    let pending: StudentRecordQuery | null = null;
    return {
      async load(query: StudentRecordQuery): Promise<void> {
        pending = query;
        patchState(store, { record: null, loading: true, error: null });
        try {
          const record = await api.record(query);
          if (pending !== query) return;
          patchState(store, { record, loading: false });
        } catch (e) {
          if (pending !== query) return;
          patchState(store, { loading: false });
          // The contract rejects with a StudentRecordError; anything else is a fault, not hidden.
          if (!(e instanceof StudentRecordError)) throw e;
          patchState(store, { error: e.code });
        }
      },
    };
  }),
);
