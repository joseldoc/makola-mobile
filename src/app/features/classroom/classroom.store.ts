import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { Assignment, Student } from './model';

/**
 * Sample data taken from the @makola UI kit (ui_kits/app/ClasseScreen.jsx),
 * waiting for a real API — this repository has no backend yet. Names and class
 * labels are Congolese school data: they stay as entered, whatever the language.
 */
const ASSIGNMENTS: Assignment[] = [
  { name: 'Contrôle n°2', coefficient: 2, scale: 20, date: '2026-03-12', average: 12.4 },
  { name: 'Interrogation ch. 5', coefficient: 1, scale: 20, date: '2026-03-06', average: 11.8 },
  { name: 'Devoir maison n°1', coefficient: 1, scale: 20, date: '2026-02-28', average: 14.1 }
];

const STUDENTS: Student[] = [
  { name: 'ILUNGA Marie', average: 16.75 },
  { name: 'MOUKALA Chris', average: 9.2, belowPass: true },
  { name: 'NGOMA Divine', average: 13.5 },
  { name: 'OBAMBI Junior', average: 11.05 },
  { name: 'SAMBA Rose', average: 15.4 },
  { name: 'TATI Gloire', average: 8.75, belowPass: true }
];

interface ClassroomState {
  classroom: string;
  subject: string;
  school: string;
  term: number;
  assignments: Assignment[];
  students: Student[];
  view: number;
  search: string;
  scrolled: boolean;
  offline: boolean;
}

const initialState: ClassroomState = {
  classroom: '4ème B',
  subject: 'Maths',
  school: 'Lycée Chaminade',
  term: 2,
  assignments: ASSIGNMENTS,
  students: STUDENTS,
  view: 0,
  search: '',
  scrolled: false,
  offline: true
};

export const ClassroomStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ students, search }) => ({
    filteredStudents: computed(() => {
      const q = search().toLowerCase();
      return students().filter((s) => s.name.toLowerCase().includes(q));
    })
  })),
  withMethods((store) => ({
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
    }
  }))
);
