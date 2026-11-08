import { Identifier } from './auth.model';
import { Country, countryOfNumber, formatNational } from './country';

/**
 * Phone identifier: international number without spaces, calling code
 * included (« +242066123456 ») — it carries the country.
 */
export function phoneIdentifier(country: Country, digits: string): Identifier {
  return { channel: 'phone', value: `+${country.callingCode}${digits}` };
}

export function emailIdentifier(input: string): Identifier {
  return { channel: 'email', value: input.trim().toLowerCase() };
}

/** The same contact: same channel, same normalised value. */
export function sameIdentifier(a: Identifier, b: Identifier): boolean {
  return a.channel === b.channel && a.value === b.value;
}

/**
 * Masked, as Identity masks an identifier in its notices
 * (`NormalizedIdentifier.masked`): the calling code and the last two digits of a
 * number (« +242 ••• ••56 »), the first letter and the domain of an email
 * (« m•••@example.cg »). Shown in the account sheet, which can be opened in
 * front of others; the full value stays in the fields that need it.
 */
export function maskIdentifier(identifier: Identifier): string {
  const { value } = identifier;
  if (identifier.channel === 'email') {
    const at = value.indexOf('@');
    return at > 0 ? `${value.charAt(0)}•••${value.slice(at)}` : '•••';
  }
  const country = countryOfNumber(value);
  // Identity keeps the first four characters: « +242 », « +254 » — the calling code here.
  const prefix = country ? `+${country.callingCode}` : value.slice(0, 4);
  return `${prefix} ••• ••${value.slice(-2)}`;
}

/** For sentences: « +242 06 612 34 56 », « marie@example.cg ». */
export function formatIdentifier(identifier: Identifier): string {
  if (identifier.channel === 'email') return identifier.value;
  const country = countryOfNumber(identifier.value);
  if (!country) return identifier.value;
  const national = identifier.value.slice(1 + country.callingCode.length);
  return `+${country.callingCode} ${formatNational(country, national)}`;
}
