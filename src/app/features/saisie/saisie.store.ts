import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

/** Élèves d'exemple repris de ui_kits/app/SaisieScreen.jsx (ClasseScreen partage la même classe). */
const NOMS = ['ILUNGA Marie', 'MOUKALA Chris', 'NGOMA Divine', 'OBAMBI Junior', 'SAMBA Rose', 'TATI Gloire'];

interface SaisieState {
  titre: string;
  noms: string[];
  notes: string[];
  indexActif: number;
  flashIndex: number | null;
}

const initialState: SaisieState = {
  titre: 'Contrôle n°2',
  noms: NOMS,
  notes: ['18', '9,5', '', '', '', ''],
  indexActif: 2,
  flashIndex: null
};

export const SaisieStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ notes, noms }) => ({
    saisies: computed(() => notes().filter(Boolean).length),
    sousTitre: computed(() => `4ème B · /20 · coef 2 · ${notes().filter(Boolean).length} / ${noms().length} saisis`)
  })),
  withMethods((store) => {
    const noteActive = () => store.notes()[store.indexActif()] ?? '';
    const remplacerNoteActive = (valeur: string) => {
      const notes = [...store.notes()];
      notes[store.indexActif()] = valeur;
      patchState(store, { notes });
    };

    return {
      setActif(index: number): void {
        patchState(store, { indexActif: index });
      },
      saisirChiffre(d: string): void {
        remplacerNoteActive(noteActive() + d);
      },
      saisirVirgule(): void {
        remplacerNoteActive(noteActive().includes(',') ? noteActive() : noteActive() + ',');
      },
      effacerChiffre(): void {
        remplacerNoteActive(noteActive().slice(0, -1));
      },
      marquerAbsent(): void {
        remplacerNoteActive('Absent');
      },
      marquerNonNote(): void {
        remplacerNoteActive('Non noté');
      },
      /** Flash de confirmation (420 ms) puis avance à l'élève suivant. */
      suivant(): void {
        const i = store.indexActif();
        patchState(store, { flashIndex: i });
        setTimeout(() => patchState(store, { flashIndex: null }), 420);
        patchState(store, { indexActif: Math.min(store.noms().length - 1, i + 1) });
      }
    };
  })
);
