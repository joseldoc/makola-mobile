import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { FilItem } from './modele';

/** Repris de ui_kits/app/FilParentScreen.jsx. */
const FIL: FilItem[] = [
  { titre: 'Nouvelle note', meta: 'Contrôle n°2 · Maths · coef 2', valeur: '18', quand: 'il y a 2 minutes' },
  { titre: 'Note en dessous de 10', meta: 'Interrogation ch. 5 · Maths', valeur: '9', quand: '11 mars' },
  { titre: 'Contrôle annoncé', meta: 'Maths · ch. 6 Angles inscrits', valeur: '26 mars', quand: 'hier, 17:41' },
  { titre: 'Bulletin disponible', meta: 'Trimestre 1 · Mathématiques', valeur: 'PDF', quand: '12 déc.' }
];

interface FilParentState {
  eleveNom: string;
  eleveInitiales: string;
  classe: string;
  moyenneMatiere: string;
  fil: FilItem[];
  alerteResume: boolean;
  scrolled: boolean;
}

const initialState: FilParentState = {
  eleveNom: 'ILUNGA Marie',
  eleveInitiales: 'IM',
  classe: '4ème B · Lycée Chaminade',
  moyenneMatiere: '16,75',
  fil: FIL,
  alerteResume: true,
  scrolled: false
};

export const FilParentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    toggleAlerte(actif: boolean): void {
      patchState(store, { alerteResume: actif });
    },
    setScrolled(scrolled: boolean): void {
      patchState(store, { scrolled });
    }
  }))
);
