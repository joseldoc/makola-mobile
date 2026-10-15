export type Language = 'en' | 'fr';

export const LANGUAGES: Language[] = ['en', 'fr'];

/** English by default — the device language never overrides it silently. */
export const DEFAULT_LANGUAGE: Language = 'en';
