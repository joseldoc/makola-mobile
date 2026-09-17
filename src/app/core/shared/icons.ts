// Source: @makola Design System (claude.ai/design) — components/foundation/Icon.jsx
// Ionicons, style outline exclusivement. Aucune variante pleine, aucune `-sharp`.
// Quinze noms, et c'est tout : une icône absente d'ici est une décision à prendre,
// pas un détail d'implémentation.
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronDownOutline,
  searchOutline,
  closeOutline,
  backspaceOutline,
  checkmarkOutline,
  removeOutline,
  addOutline,
  trendingUpOutline,
  documentTextOutline,
  calendarOutline,
  cloudOfflineOutline,
  cloudDoneOutline,
  personOutline,
  peopleOutline
} from 'ionicons/icons';

export const ICONS = {
  retour: 'chevron-back-outline',
  deplier: 'chevron-down-outline',
  recherche: 'search-outline',
  effacer: 'close-outline',
  effacementPave: 'backspace-outline',
  coche: 'checkmark-outline',
  moins: 'remove-outline',
  plus: 'add-outline',
  progression: 'trending-up-outline',
  document: 'document-text-outline',
  calendrier: 'calendar-outline',
  horsLigne: 'cloud-offline-outline',
  synchronise: 'cloud-done-outline',
  eleve: 'person-outline',
  classe: 'people-outline'
} as const;

export type IconName = (typeof ICONS)[keyof typeof ICONS];

let registered = false;

/** Enregistre les 15 icônes une fois par app. Appelé automatiquement par IconComponent. */
export function registerIcons(): void {
  if (registered) return;
  registered = true;
  addIcons({
    [ICONS.retour]: chevronBackOutline,
    [ICONS.deplier]: chevronDownOutline,
    [ICONS.recherche]: searchOutline,
    [ICONS.effacer]: closeOutline,
    [ICONS.effacementPave]: backspaceOutline,
    [ICONS.coche]: checkmarkOutline,
    [ICONS.moins]: removeOutline,
    [ICONS.plus]: addOutline,
    [ICONS.progression]: trendingUpOutline,
    [ICONS.document]: documentTextOutline,
    [ICONS.calendrier]: calendarOutline,
    [ICONS.horsLigne]: cloudOfflineOutline,
    [ICONS.synchronise]: cloudDoneOutline,
    [ICONS.eleve]: personOutline,
    [ICONS.classe]: peopleOutline
  });
}
