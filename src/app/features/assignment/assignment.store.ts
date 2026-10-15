import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { Message } from '@core/i18n/translate';
import { TextFieldState } from '@core/shared/components/forms/text-field/text-field';

import { AssignmentDate, Scale } from './model';

/** Taken from ui_kits/app/DevoirSheet.jsx — per-field validation (RM-13, RM-14). */
const DATES: AssignmentDate[] = [
  {
    date: '2026-03-19',
    today: true,
    state: 'idle',
    message: { key: 'assignment.date.inTerm', params: { term: 2, end: '2026-03-27' } }
  },
  {
    date: '2026-04-02',
    state: 'warning',
    message: { key: 'assignment.date.afterClose', params: { term: 2, next: 3 } }
  },
  {
    date: '2026-01-04',
    state: 'error',
    message: { key: 'assignment.date.closed', params: { term: 1, after: '2026-01-06' } }
  }
];

/** Titles already used in this class this term (data, compared case-insensitively). */
const EXISTING = ['contrôle n°2', 'interrogation ch. 5', 'devoir maison n°1'];

const MIN_COEFFICIENT = 1;
const MAX_COEFFICIENT = 9;
const TITLE_MAX = 60;
const TITLE_WARN = 48;

interface AssignmentState {
  classroom: string;
  subject: string;
  title: string;
  scale: Scale;
  coefficient: number;
  dateIndex: number;
}

const initialState: AssignmentState = {
  classroom: '4ème B',
  subject: 'Maths',
  title: 'Contrôle n°2',
  scale: 20,
  coefficient: 2,
  dateIndex: 0
};

export const AssignmentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ title, dateIndex, coefficient }) => ({
    titleState: computed<TextFieldState>(() => {
      const t = title().trim();
      if (t === '' || t.length < 3 || EXISTING.includes(t.toLowerCase())) return 'error';
      if (title().length > TITLE_MAX) return 'error';
      if (title().length > TITLE_WARN) return 'warning';
      return 'idle';
    }),
    titleMessage: computed<Message | null>(() => {
      const raw = title();
      const t = raw.trim();
      if (t === '') return { key: 'assignment.titleErrors.empty' };
      if (t.length < 3) return { key: 'assignment.titleErrors.tooShort' };
      if (EXISTING.includes(t.toLowerCase())) return { key: 'assignment.titleErrors.duplicate', params: { title: t } };
      if (raw.length > TITLE_MAX) return { key: 'assignment.titleErrors.tooLong', params: { max: TITLE_MAX } };
      if (raw.length > TITLE_WARN) return { key: 'assignment.titleErrors.long' };
      return null;
    }),
    currentDate: computed(() => DATES[dateIndex()]),
    coefficientMessage: computed<Message>(() => {
      if (coefficient() >= MAX_COEFFICIENT) return { key: 'assignment.coefficient.max' };
      if (coefficient() === MIN_COEFFICIENT) return { key: 'assignment.coefficient.base' };
      return { key: 'assignment.coefficient.weight', params: { count: coefficient() } };
    }),
    atMinCoefficient: computed(() => coefficient() <= MIN_COEFFICIENT),
    atMaxCoefficient: computed(() => coefficient() >= MAX_COEFFICIENT),
    titleCounter: computed(() => `${title().length} / ${TITLE_MAX}`)
  })),
  withComputed((store) => ({
    blocked: computed(() => store.titleState() === 'error' || store.currentDate().state === 'error')
  })),
  withMethods((store) => ({
    setTitle(value: string): void {
      patchState(store, { title: value.slice(0, 70) });
    },
    setScale(scale: Scale): void {
      patchState(store, { scale });
    },
    incrementCoefficient(): void {
      patchState(store, { coefficient: Math.min(MAX_COEFFICIENT, store.coefficient() + 1) });
    },
    decrementCoefficient(): void {
      patchState(store, { coefficient: Math.max(MIN_COEFFICIENT, store.coefficient() - 1) });
    },
    nextDate(): void {
      patchState(store, { dateIndex: (store.dateIndex() + 1) % DATES.length });
    },
    reset(): void {
      patchState(store, initialState);
    }
  }))
);
