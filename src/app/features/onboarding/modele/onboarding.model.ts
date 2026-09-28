import { TonalHeaderRole } from '@core/shared/components/data/tonal-header/tonal-header';
import { IconName } from '@core/shared/icons';

/** Un écran de la présentation. Aucune illustration : une icône du jeu, un titre, un texte. */
export interface OnboardingSlide {
  role: TonalHeaderRole;
  icon: IconName;
  /** Sur-titre court, au-dessus du titre. */
  rubrique: string;
  titre: string;
  texte: string;
}
