import { Language } from './language';

/** en-GB: day before month (« 12 Mar »), the order read in Congo and in Kenya. */
const LOCALES: Record<Language, string> = { en: 'en-GB', fr: 'fr-FR' };

/** 16.75 in English, 16,75 in French — always tabular in the UI (--mk-num). */
export function formatDecimal(value: number, language: Language, maxFractionDigits = 2): string {
  return new Intl.NumberFormat(LOCALES[language], { maximumFractionDigits: maxFractionDigits }).format(value);
}

/** Decimal separator typed on the keypad: « . » in English, « , » in French. */
export function decimalSeparator(language: Language): string {
  return language === 'fr' ? ',' : '.';
}

/** « 12 Mar » / « 12 mars » — or with the year: « 19 March 2026 ». */
export function formatDate(iso: string, language: Language, style: 'short' | 'long' = 'short'): string {
  const date = new Date(`${iso}T12:00:00`);
  const options: Intl.DateTimeFormatOptions =
    style === 'short' ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(LOCALES[language], options).format(date);
}
