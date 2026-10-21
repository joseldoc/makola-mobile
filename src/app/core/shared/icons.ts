// Source: @makola Design System (claude.ai/design) — components/foundation/Icon.jsx
// Ionicons, outline style only. No filled variant, no `-sharp`.
// This list IS the inventory: an icon missing from it is a decision to make,
// not an implementation detail. `logout` (16th) was added with account sign-in —
// to be reported to the design system (components/foundation/Icon.jsx).
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
  peopleOutline,
  logOutOutline
} from 'ionicons/icons';

export const ICONS = {
  back: 'chevron-back-outline',
  expand: 'chevron-down-outline',
  search: 'search-outline',
  clear: 'close-outline',
  backspace: 'backspace-outline',
  check: 'checkmark-outline',
  minus: 'remove-outline',
  plus: 'add-outline',
  progress: 'trending-up-outline',
  document: 'document-text-outline',
  calendar: 'calendar-outline',
  offline: 'cloud-offline-outline',
  synced: 'cloud-done-outline',
  student: 'person-outline',
  classroom: 'people-outline',
  logout: 'log-out-outline'
} as const;

export type IconName = (typeof ICONS)[keyof typeof ICONS];

let registered = false;

/** Registers the 16 icons once per app. Called automatically by IconComponent. */
export function registerIcons(): void {
  if (registered) return;
  registered = true;
  addIcons({
    [ICONS.back]: chevronBackOutline,
    [ICONS.expand]: chevronDownOutline,
    [ICONS.search]: searchOutline,
    [ICONS.clear]: closeOutline,
    [ICONS.backspace]: backspaceOutline,
    [ICONS.check]: checkmarkOutline,
    [ICONS.minus]: removeOutline,
    [ICONS.plus]: addOutline,
    [ICONS.progress]: trendingUpOutline,
    [ICONS.document]: documentTextOutline,
    [ICONS.calendar]: calendarOutline,
    [ICONS.offline]: cloudOfflineOutline,
    [ICONS.synced]: cloudDoneOutline,
    [ICONS.student]: personOutline,
    [ICONS.classroom]: peopleOutline,
    [ICONS.logout]: logOutOutline
  });
}
