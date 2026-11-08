import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { Scale } from '@core/models/grading';

import {
  ABSENT,
  GradeCell,
  GradeEntryContext,
  isCode,
  UNGRADED,
} from '../models/grade-entry.model';

/** Sample students from ui_kits/app/SaisieScreen.jsx (the classroom screen shares the same class). */
const NAMES = [
  'ILUNGA Marie',
  'MOUKALA Chris',
  'NGOMA Divine',
  'OBAMBI Junior',
  'SAMBA Rose',
  'TATI Gloire',
];

const FLASH_MS = 420;

interface GradeEntryState {
  assignment: string;
  classroom: string;
  scale: Scale;
  coefficient: number;
  names: string[];
  grades: GradeCell[];
  activeIndex: number;
  flashIndex: number | null;
}

const initialState: GradeEntryState = {
  assignment: 'Contrôle n°2',
  classroom: '4ème B',
  scale: 20,
  coefficient: 2,
  names: NAMES,
  grades: ['18', '9.5', '', '', '', ''],
  activeIndex: 2,
  flashIndex: null,
};

export const GradeEntryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ grades }) => ({
    entered: computed(() => grades().filter(Boolean).length),
  })),
  withMethods((store) => {
    const activeGrade = () => store.grades()[store.activeIndex()] ?? '';
    const replaceActiveGrade = (value: GradeCell) => {
      const grades = [...store.grades()];
      grades[store.activeIndex()] = value;
      patchState(store, { grades });
    };
    /** Typing on a code starts a new value: « absent » is replaced, never appended to. */
    const numericGrade = () => (isCode(activeGrade()) ? '' : activeGrade());

    return {
      /**
       * Opens the entry of an assignment. The same assignment of the same class
       * keeps what was typed; another one starts empty, on its first student.
       */
      open(context: GradeEntryContext): void {
        if (context.classroom === store.classroom() && context.assignment === store.assignment())
          return;
        patchState(store, {
          ...context,
          grades: context.names.map(() => ''),
          activeIndex: 0,
          flashIndex: null,
        });
      },
      setActive(index: number): void {
        patchState(store, { activeIndex: index });
      },
      typeDigit(d: string): void {
        replaceActiveGrade(numericGrade() + d);
      },
      typeDecimal(): void {
        const grade = numericGrade();
        replaceActiveGrade(grade.includes('.') ? grade : (grade || '0') + '.');
      },
      eraseDigit(): void {
        replaceActiveGrade(numericGrade().slice(0, -1));
      },
      markAbsent(): void {
        replaceActiveGrade(ABSENT);
      },
      markUngraded(): void {
        replaceActiveGrade(UNGRADED);
      },
      /** Confirmation flash (420 ms) then moves on to the next student. */
      next(): void {
        const i = store.activeIndex();
        patchState(store, { flashIndex: i });
        setTimeout(() => patchState(store, { flashIndex: null }), FLASH_MS);
        patchState(store, { activeIndex: Math.min(store.names().length - 1, i + 1) });
      },
    };
  }),
);
