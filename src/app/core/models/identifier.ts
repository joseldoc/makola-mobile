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

/** For sentences: « +242 06 612 34 56 », « marie@example.cg ». */
export function formatIdentifier(identifier: Identifier): string {
  if (identifier.channel === 'email') return identifier.value;
  const country = countryOfNumber(identifier.value);
  if (!country) return identifier.value;
  const national = identifier.value.slice(1 + country.callingCode.length);
  return `+${country.callingCode} ${formatNational(country, national)}`;
}
