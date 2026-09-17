import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { Devoir, Eleve } from './modele';

/**
 * Données d'exemple reprises telles quelles du UI kit @makola (ui_kits/app/ClasseScreen.jsx) —
 * en attendant une API réelle, ce dépôt étant encore sans backend.
 */
const DEVOIRS: Devoir[] = [
  { nom: 'Contrôle n°2', meta: 'coef 2 · /20 · 12 mars', val: '12,4' },
  { nom: 'Interrogation ch. 5', meta: 'coef 1 · /20 · 6 mars', val: '11,8' },
  { nom: 'Devoir maison n°1', meta: 'coef 1 · /20 · 28 févr.', val: '14,1' }
];

const ELEVES: Eleve[] = [
  { nom: 'ILUNGA Marie', val: '16,75' },
  { nom: 'MOUKALA Chris', val: '9,20', bas: true },
  { nom: 'NGOMA Divine', val: '13,50' },
  { nom: 'OBAMBI Junior', val: '11,05' },
  { nom: 'SAMBA Rose', val: '15,40' },
  { nom: 'TATI Gloire', val: '8,75', bas: true }
];

interface ClasseState {
  titre: string;
  sousTitre: string;
  devoirs: Devoir[];
  eleves: Eleve[];
  vue: number;
  recherche: string;
  scrolled: boolean;
  horsLigne: boolean;
}

const initialState: ClasseState = {
  titre: '4ème B · Maths',
  sousTitre: 'Lycée Chaminade · Trimestre 2',
  devoirs: DEVOIRS,
  eleves: ELEVES,
  vue: 0,
  recherche: '',
  scrolled: false,
  horsLigne: true
};

export const ClasseStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ eleves, recherche }) => ({
    elevesFiltres: computed(() => {
      const q = recherche().toLowerCase();
      return eleves().filter((e) => e.nom.toLowerCase().includes(q));
    })
  })),
  withMethods((store) => ({
    setVue(vue: number): void {
      patchState(store, { vue });
    },
    setRecherche(recherche: string): void {
      patchState(store, { recherche });
    },
    clearRecherche(): void {
      patchState(store, { recherche: '' });
    },
    setScrolled(scrolled: boolean): void {
      patchState(store, { scrolled });
    }
  }))
);
