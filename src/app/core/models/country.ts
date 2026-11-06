/**
 * Target countries — Republic of the Congo (launch market) and Kenya. The
 * country is deduced from the phone number's calling code and never asked
 * again. The admin reference data (US-AD04) will replace this table. Each entry
 * holds the national mobile format as dialled after the calling code.
 */
export type CountryCode = 'CG' | 'KE';

export interface Country {
  code: CountryCode;
  callingCode: string;
  /** Digits after the calling code. */
  length: number;
  /** Valid national mobile number. */
  mobile: RegExp;
  /** Allowed number starts, for the refusal message. */
  prefixes: string;
  /** Grouping read in the country: 06 612 34 56. */
  groups: number[];
  /** Cities offered at the "city" step — a shortcut, not a constraint. */
  cities: string[];
}

export const COUNTRIES: Country[] = [
  {
    code: 'CG',
    callingCode: '242',
    length: 9,
    mobile: /^0[456]\d{7}$/,
    prefixes: '04, 05, 06',
    groups: [2, 3, 2, 2],
    cities: ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso']
  },
  {
    code: 'KE',
    callingCode: '254',
    length: 9,
    mobile: /^[17]\d{8}$/,
    prefixes: '7, 1',
    groups: [3, 3, 3],
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret']
  }
];

/** The launch market (Brazzaville): the calling code offered first. */
export const DEFAULT_COUNTRY: CountryCode = 'CG';

export function countryByCode(code: CountryCode): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/** « +242066123456 » → Republic of the Congo. */
export function countryOfNumber(international: string): Country | undefined {
  const digits = international.replace(/^\+/, '');
  return COUNTRIES.find((c) => digits.startsWith(c.callingCode) && digits.length === c.callingCode.length + c.length);
}

/** Grouping while typing, with non-breaking spaces: a number never wraps. */
export function formatNational(country: Country, digits: string): string {
  const parts: string[] = [];
  let i = 0;
  for (const size of country.groups) {
    if (i >= digits.length) break;
    parts.push(digits.slice(i, i + size));
    i += size;
  }
  if (i < digits.length) parts.push(digits.slice(i));
  return parts.join(' ');
}
