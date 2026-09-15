// Source: @makola Design System (claude.ai/design) — components/foundation/Icon.jsx / Icon.d.ts
// Ionicons, style outline exclusivement. Aucune variante pleine, aucune `-sharp`.
// Quinze noms, et c'est tout : une icône absente d'ici est une décision à prendre,
// pas un détail d'implémentation. À utiliser avec `addIcons` (ionicons) + `<ion-icon>`
// une fois Ionic installé dans ce dépôt.
export const ICONS = {
  retour: 'chevron-back-outline',
  deplier: 'chevron-down-outline',
  recherche: 'search-outline',
  effacerChamp: 'close-outline',
  effacerPave: 'backspace-outline',
  coche: 'checkmark-outline',
  moins: 'remove-outline',
  plus: 'add-outline',
  progression: 'trending-up-outline',
  bulletin: 'document-text-outline',
  dateDevoir: 'calendar-outline',
  horsLigne: 'cloud-offline-outline',
  synchronise: 'cloud-done-outline',
  eleve: 'person-outline',
  classe: 'people-outline',
} as const;

export type IconName = (typeof ICONS)[keyof typeof ICONS];
