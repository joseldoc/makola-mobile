import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { periodOf } from '@core/models/period';

import { Classroom } from '../models/classroom.model';

/**
 * Sample data waiting for a real API — this repository has no backend yet.
 * Names and class labels are school data: they stay as entered, whatever the
 * language.
 *
 * - 4ème B is the class of the @makola UI kit (ui_kits/app/ClasseScreen.jsx),
 *   upper secondary, term 2.
 * - L1 Mathématiques is a university class (RM-02, A-12 decided on 8 November
 *   2026), in semester 2: on 19 March, the date of the samples, the first
 *   semester of an October-to-June year is closed. The university is fictional.
 */
const CLASSROOMS: Classroom[] = [
  {
    id: '4b-maths',
    name: '4ème B',
    subject: 'Maths',
    school: 'Lycée Chaminade',
    level: 'high',
    period: periodOf('high', 2),
    periodCloses: '2026-03-27',
    previousPeriodCloses: '2026-01-06',
    // Term 2 only — the assignments of the period shown. Their class averages are
    // the means of the students present (RM-15), and each student's average the
    // coefficient-weighted mean of their own grades: the sample record of
    // `MockStudentRecordApi` holds those grades, `student-record.coherence.spec.ts`
    // checks the two agree. ILUNGA Marie: (19 × 2 + 17.5 + 9 + 18 × 2) / 6 = 16.75.
    assignments: [
      { name: 'Contrôle n°2', coefficient: 2, scale: 20, date: '2026-03-12', classAverage: 12.4 },
      {
        name: 'Interrogation ch. 5',
        coefficient: 1,
        scale: 20,
        date: '2026-03-06',
        classAverage: 11.8,
      },
      {
        name: 'Devoir maison n°1',
        coefficient: 1,
        scale: 20,
        date: '2026-02-28',
        classAverage: 14.1,
      },
      {
        name: 'Interrogation ch. 4',
        coefficient: 2,
        scale: 10,
        date: '2026-01-23',
        classAverage: 6.35,
      },
    ],
    students: [
      { id: 'ilunga-marie', name: 'ILUNGA Marie', average: 16.75 },
      { id: 'moukala-chris', name: 'MOUKALA Chris', average: 9.25 },
      { id: 'ngoma-divine', name: 'NGOMA Divine', average: 13.5 },
      { id: 'obambi-junior', name: 'OBAMBI Junior', average: 11 },
      { id: 'samba-rose', name: 'SAMBA Rose', average: 15.38 },
      { id: 'tati-gloire', name: 'TATI Gloire', average: 8.7 },
    ],
  },
  {
    id: 'l1-maths',
    name: 'L1 Mathématiques',
    subject: 'Analyse',
    school: 'Université du Djoué',
    level: 'university',
    period: periodOf('university', 2),
    periodCloses: '2026-06-12',
    previousPeriodCloses: '2026-02-06',
    // Semester 2 only, like 4ème B: same coherence with the sample record.
    assignments: [
      { name: 'Partiel n°1', coefficient: 3, scale: 20, date: '2026-03-10', classAverage: 10.9 },
      { name: 'TD n°4', coefficient: 1, scale: 10, date: '2026-03-04', classAverage: 6.2 },
      { name: 'TD n°3', coefficient: 1, scale: 10, date: '2026-02-20', classAverage: 5.75 },
    ],
    students: [
      { id: 'banzouzi-grace', name: 'BANZOUZI Grâce', average: 13.19 },
      { id: 'elenga-fortune', name: 'ELENGA Fortuné', average: 9.6 },
      { id: 'kimbembe-sarah', name: 'KIMBEMBE Sarah', average: 11.4 },
      { id: 'makaya-prince', name: 'MAKAYA Prince', average: 7.85 },
      { id: 'nkouka-ornella', name: 'NKOUKA Ornella', average: 14.9 },
    ],
  },
];

interface ClassroomState {
  classrooms: Classroom[];
  /** Id of the class shown. */
  selected: string;
  view: number;
  search: string;
  scrolled: boolean;
  offline: boolean;
}

const initialState: ClassroomState = {
  classrooms: CLASSROOMS,
  selected: CLASSROOMS[0].id,
  view: 0,
  search: '',
  scrolled: false,
  offline: true,
};

export const ClassroomStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ classrooms, selected }) => ({
    /** The class shown — its period, calendar, assignments and students. */
    current: computed(() => classrooms().find((c) => c.id === selected()) ?? classrooms()[0]),
    /** « Change class » is offered only when there is another one to show. */
    hasOtherClassrooms: computed(() => classrooms().length > 1),
  })),
  withComputed(({ current, search }) => ({
    filteredStudents: computed(() => {
      const q = search().toLowerCase();
      return current().students.filter((s) => s.name.toLowerCase().includes(q));
    }),
  })),
  withMethods((store) => ({
    /** Shows the teacher's next class, in list order; the search belonged to the previous one. */
    nextClassroom(): void {
      const list = store.classrooms();
      const index = list.findIndex((c) => c.id === store.selected());
      patchState(store, { selected: list[(index + 1) % list.length].id, search: '' });
    },
    setView(view: number): void {
      patchState(store, { view });
    },
    setSearch(search: string): void {
      patchState(store, { search });
    },
    clearSearch(): void {
      patchState(store, { search: '' });
    },
    setScrolled(scrolled: boolean): void {
      patchState(store, { scrolled });
    },
  })),
);
