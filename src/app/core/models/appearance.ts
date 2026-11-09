/**
 * Appearance (dark mode, decision of 9 November 2026): the phone's setting by
 * default, or a choice made in the app — beside the language.
 */
export type Appearance = 'system' | 'light' | 'dark';

/** In the order of the segmented control: the default first. */
export const APPEARANCES: readonly Appearance[] = ['system', 'light', 'dark'];

/** The phone decides until the user chooses. */
export const DEFAULT_APPEARANCE: Appearance = 'system';

/** What is shown: the appearance once the phone's setting is resolved. */
export type Theme = 'light' | 'dark';

/**
 * Shared with `public/theme-boot.js`, which sets the theme before the first paint:
 * the storage key, the attribute read by the design system's dark derivation
 * (`src/theme/tokens/dark.scss`) and the media query. `theme-boot.spec.ts`
 * checks that both say the same.
 */
export const APPEARANCE_KEY = 'mk.appearance';
export const THEME_ATTRIBUTE = 'data-mk-theme';
export const DARK_THEME_VALUE = 'sombre';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export function isAppearance(value: unknown): value is Appearance {
  return APPEARANCES.includes(value as Appearance);
}

/** A choice wins; « system » follows the phone. */
export function themeOf(appearance: Appearance, systemDark: boolean): Theme {
  if (appearance === 'system') return systemDark ? 'dark' : 'light';
  return appearance;
}
