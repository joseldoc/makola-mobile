import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { TextFieldState } from '@core/shared/components/forms/text-field/text-field';

import { Bareme, DateDevoir } from './modele';

/** Repris de ui_kits/app/DevoirSheet.jsx — validation par champ (RM-13, RM-14). */
const DATES: DateDevoir[] = [
  { label: "Aujourd'hui · 19 mars 2026", state: 'repos', message: 'Dans le trimestre 2, en cours jusqu\'au 27 mars.' },
  {
    label: '2 avril 2026',
    state: 'alerte',
    message: 'Après la clôture du trimestre 2 : ce devoir comptera pour le trimestre 3.'
  },
  {
    label: '4 janvier 2026',
    state: 'erreur',
    message: 'Le trimestre 1 est clôturé. Choisissez une date après le 6 janvier.'
  }
];

const EXISTANTS = ['contrôle n°2', 'interrogation ch. 5', 'devoir maison n°1'];

interface DevoirState {
  titre: string;
  bareme: Bareme;
  coef: number;
  dateIndex: number;
}

const initialState: DevoirState = {
  titre: 'Contrôle n°2',
  bareme: '/20',
  coef: 2,
  dateIndex: 0
};

export const DevoirStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ titre, dateIndex }) => ({
    titreEtat: computed<TextFieldState>(() => {
      const t = titre().trim();
      if (t === '' || t.length < 3 || EXISTANTS.includes(t.toLowerCase())) return 'erreur';
      if (titre().length > 60) return 'erreur';
      if (titre().length > 48) return 'alerte';
      return 'repos';
    }),
    titreMessage: computed(() => {
      const brut = titre();
      const t = brut.trim();
      if (t === '') return "Donnez un intitulé : c'est ce que verront les élèves et les parents.";
      if (t.length < 3) return 'Trop court pour être reconnaissable dans la liste des devoirs.';
      if (EXISTANTS.includes(t.toLowerCase())) {
        return `« ${t} » existe déjà dans cette classe ce trimestre. Changez le numéro ou la date.`;
      }
      if (brut.length > 60) return "60 caractères maximum : au-delà, l'intitulé est coupé sur le bulletin.";
      if (brut.length > 48) return 'Long pour un bulletin : il sera lisible, mais serré.';
      return '';
    }),
    dateActuelle: computed(() => DATES[dateIndex()])
  })),
  withComputed((store) => ({
    bloque: computed(() => store.titreEtat() === 'erreur' || store.dateActuelle().state === 'erreur'),
    messageCoef: computed(() =>
      store.coef() >= 9
        ? 'Coefficient maximal. Au-delà, un seul devoir déciderait de la moyenne.'
        : `Pèse ${store.coef()} fois plus qu'un devoir de coefficient 1.`
    )
  })),
  withMethods((store) => ({
    setTitre(valeur: string): void {
      patchState(store, { titre: valeur.slice(0, 70) });
    },
    setBareme(bareme: Bareme): void {
      patchState(store, { bareme });
    },
    incrementerCoef(): void {
      patchState(store, { coef: Math.min(9, store.coef() + 1) });
    },
    decrementerCoef(): void {
      patchState(store, { coef: Math.max(1, store.coef() - 1) });
    },
    changerDate(): void {
      patchState(store, { dateIndex: (store.dateIndex() + 1) % DATES.length });
    },
    reinitialiser(): void {
      patchState(store, initialState);
    }
  }))
);
