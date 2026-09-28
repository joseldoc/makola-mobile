import { Identifiant } from './auth.model';

/** Mobile congolais (Brazzaville) : 9 chiffres, 04 · 05 · 06. */
export const TELEPHONE_MOBILE = /^0[456]\d{7}$/;

/** « +242 06 612 34 56 », « 00242066123456 », « 06-612-34-56 » → « 066123456 ». */
export function normaliserTelephone(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, '');
  if (chiffres.startsWith('00242')) return chiffres.slice(5);
  if (chiffres.startsWith('242') && chiffres.length === 12) return chiffres.slice(3);
  return chiffres;
}

/**
 * « 066123456 » → « 06 612 34 56 » — le groupement lu au Congo. Espaces
 * insécables : un numéro ne se coupe jamais en fin de ligne.
 */
export function formaterTelephone(valeur: string): string {
  const m = /^(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(valeur);
  return m ? [m[1], m[2], m[3], m[4]].join('\u00A0') : valeur;
}

export function creerIdentifiant(canal: Identifiant['canal'], saisie: string): Identifiant {
  return canal === 'telephone'
    ? { canal, valeur: normaliserTelephone(saisie) }
    : { canal, valeur: saisie.trim().toLowerCase() };
}

/** Pour les phrases : « au 06 612 34 56 », « à marie@exemple.cg ». */
export function libelleIdentifiant(identifiant: Identifiant): string {
  return identifiant.canal === 'telephone' ? formaterTelephone(identifiant.valeur) : identifiant.valeur;
}
