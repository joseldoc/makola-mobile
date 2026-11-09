import { Language } from './language';

/** en-GB: day before month (« 12 Mar »), the order read in Congo and in Kenya. */
const LOCALES: Record<Language, string> = { en: 'en-GB', fr: 'fr-FR' };

/** 16.75 in English, 16,75 in French — always tabular in the UI (--mk-num). */
export function formatDecimal(value: number, language: Language, maxFractionDigits = 2): string {
  return new Intl.NumberFormat(LOCALES[language], {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

/** Decimal separator typed on the keypad: « . » in English, « , » in French. */
export function decimalSeparator(language: Language): string {
  return language === 'fr' ? ',' : '.';
}

/**
 * « 12 Mar » / « 12 mars » — or with the year: « 19 March 2026 ». Non-breaking
 * spaces: a date never wraps between its day and its month.
 */
export function formatDate(
  iso: string,
  language: Language,
  style: 'short' | 'long' = 'short',
): string {
  const date = new Date(`${iso}T12:00:00`);
  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(LOCALES[language], options).format(date).replace(/ /g, '\u00a0');
}

/**
 * The short date in two parts, for a chart axis where it is set on two lines:
 * \u00ab 12 \u00bb and \u00ab Mar \u00bb in English, \u00ab 12 \u00bb and \u00ab mars \u00bb in French.
 */
export function formatDateParts(iso: string, language: Language): { day: string; month: string } {
  const parts = new Intl.DateTimeFormat(LOCALES[language], {
    day: 'numeric',
    month: 'short',
  }).formatToParts(new Date(`${iso}T12:00:00`));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return { day: part('day'), month: part('month') };
}
