import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { Message } from '@core/i18n/translate';
import { Scale } from '@core/models/grading';
import { periodKey } from '@core/models/period';
import { TextFieldState } from '@shared/forms/text-field/text-field';

import { checkAssignmentDate } from '../models/assignment-date';
import { AssignmentContext, AssignmentDate } from '../models/assignment.model';

/**
 * Today in the sample data (ui_kits/app/DevoirSheet.jsx), until a date picker
 * exists: « Change » walks through today, a date after the current period
 * closes and a date in the closed period before it — what RM-14 tells apart.
 */
const SAMPLE_TODAY = '2026-03-19';

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Until the classroom screen opens the sheet: the class of the UI kit (4ème B, term 2). */
const DEFAULT_CONTEXT: AssignmentContext = {
  classroom: '4ème B',
  subject: 'Maths',
  calendar: {
    period: { kind: 'term', n: 2 },
    periodCloses: '2026-03-27',
    previousPeriodCloses: '2026-01-06',
  },
  existingTitles: ['Contrôle n°2', 'Interrogation ch. 5', 'Devoir maison n°1'],
};

const MIN_COEFFICIENT = 1;
const MAX_COEFFICIENT = 9;
const TITLE_MAX = 60;
const TITLE_WARN = 48;

interface AssignmentState {
  context: AssignmentContext;
  title: string;
  scale: Scale;
  coefficient: number;
  dateIndex: number;
}

const initialForm = {
  title: 'Contrôle n°2',
  scale: 20 as Scale,
  coefficient: 2,
  dateIndex: 0,
};

const initialState: AssignmentState = { context: DEFAULT_CONTEXT, ...initialForm };

export const AssignmentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ context }) => ({
    classroom: computed(() => context().classroom),
    subject: computed(() => context().subject),
    existing: computed(() => context().existingTitles.map((t) => t.toLowerCase())),
    dates: computed<AssignmentDate[]>(() => {
      const { periodCloses, previousPeriodCloses } = context().calendar;
      const candidates = [
        SAMPLE_TODAY,
        addDays(periodCloses, 6),
        ...(previousPeriodCloses ? [addDays(previousPeriodCloses, -2)] : []),
      ];
      return candidates.map((date) => ({
        date,
        today: date === SAMPLE_TODAY,
        ...checkAssignmentDate(date, context().calendar),
      }));
    }),
  })),
  withComputed(({ title, dateIndex, coefficient, context, existing, dates }) => ({
    titleState: computed<TextFieldState>(() => {
      const t = title().trim();
      if (t === '' || t.length < 3 || existing().includes(t.toLowerCase())) return 'error';
      if (title().length > TITLE_MAX) return 'error';
      if (title().length > TITLE_WARN) return 'warning';
      return 'idle';
    }),
    titleMessage: computed<Message | null>(() => {
      const raw = title();
      const t = raw.trim();
      if (t === '') return { key: 'assignment.titleErrors.empty' };
      if (t.length < 3) return { key: 'assignment.titleErrors.tooShort' };
      if (existing().includes(t.toLowerCase()))
        return {
          key: periodKey('assignment.titleErrors.duplicate', context().calendar.period.kind),
          params: { title: t },
        };
      if (raw.length > TITLE_MAX)
        return { key: 'assignment.titleErrors.tooLong', params: { max: TITLE_MAX } };
      if (raw.length > TITLE_WARN) return { key: 'assignment.titleErrors.long' };
      return null;
    }),
    currentDate: computed(() => dates()[dateIndex() % dates().length]),
    coefficientMessage: computed<Message>(() => {
      if (coefficient() >= MAX_COEFFICIENT) return { key: 'assignment.coefficient.max' };
      if (coefficient() === MIN_COEFFICIENT) return { key: 'assignment.coefficient.base' };
      return { key: 'assignment.coefficient.weight', params: { count: coefficient() } };
    }),
    atMinCoefficient: computed(() => coefficient() <= MIN_COEFFICIENT),
    atMaxCoefficient: computed(() => coefficient() >= MAX_COEFFICIENT),
    titleCounter: computed(() => `${title().length} / ${TITLE_MAX}`),
  })),
  withComputed((store) => ({
    blocked: computed(
      () => store.titleState() === 'error' || store.currentDate().state === 'error',
    ),
  })),
  withMethods((store) => ({
    /** A new assignment in this class: its calendar and its titles, a fresh sheet. */
    open(context: AssignmentContext): void {
      patchState(store, { context, ...initialForm });
    },
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
      patchState(store, { dateIndex: (store.dateIndex() + 1) % store.dates().length });
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
