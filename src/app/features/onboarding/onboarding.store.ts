import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { ICONS } from '@core/shared/icons';
import { OnboardingSlide } from './modele';

/**
 * Quatre écrans, pas un de plus : ce que fait l'outil, ce qu'il garantit, et
 * les limites qu'il énonce au lieu de les cacher (voix @makola : sobre, « vous »).
 */
const SLIDES: OnboardingSlide[] = [
  {
    role: 'prof',
    icon: ICONS.classe,
    rubrique: 'Le carnet de notes du professeur',
    titre: 'Vos classes, rangées par établissement',
    texte:
      "Chaque classe appartient à son école. Le nom de l'établissement reste affiché pendant toute la saisie : deux contextes ne se mélangent jamais."
  },
  {
    role: 'prof',
    icon: ICONS.horsLigne,
    rubrique: 'Hors ligne',
    titre: 'La saisie continue sans réseau',
    texte:
      'Les notes sont enregistrées sur le téléphone et partent au retour du réseau. Un bandeau vous dit toujours combien de saisies attendent.'
  },
  {
    role: 'parent',
    icon: ICONS.progression,
    rubrique: 'Les parents',
    titre: 'Chaque parent suit son enfant',
    texte:
      'Vous invitez un parent par un code à 6 chiffres envoyé par SMS. Il voit les notes de son enfant, jamais celles des autres élèves.'
  },
  {
    role: 'etab',
    icon: ICONS.document,
    rubrique: 'Les bulletins',
    titre: 'Aucun rang, aucune moyenne de classe',
    texte:
      "Les bulletins portent les moyennes de l'élève, pas sa place. Leur transmission à la direction reste votre décision."
  }
];

export const OnboardingStore = signalStore(
  withState({ slides: SLIDES, index: 0 }),
  withComputed(({ slides, index }) => ({
    dernier: computed(() => index() === slides().length - 1)
  })),
  withMethods((store) => ({
    setIndex(index: number): void {
      const borne = Math.max(0, Math.min(index, store.slides().length - 1));
      if (borne !== store.index()) patchState(store, { index: borne });
    }
  }))
);
