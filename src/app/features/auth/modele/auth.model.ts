import { AlertesParent, Niveau } from '@core/auth/auth.model';

export interface Option<T extends string = string> {
  valeur: T;
  libelle: string;
  detail?: string;
}

/** Matières proposées à l'inscription — le référentiel admin (US-AD04) les remplacera. */
export const MATIERES: Option[] = [
  { valeur: 'maths', libelle: 'Mathématiques' },
  { valeur: 'physique', libelle: 'Physique-chimie' },
  { valeur: 'svt', libelle: 'Sciences de la vie et de la Terre' },
  { valeur: 'francais', libelle: 'Français' },
  { valeur: 'anglais', libelle: 'Anglais' },
  { valeur: 'histoire-geo', libelle: 'Histoire-géographie' },
  { valeur: 'philosophie', libelle: 'Philosophie' },
  { valeur: 'eps', libelle: 'Éducation physique et sportive' }
];

/** Le découpage de période suit le niveau (RM-02). */
export const NIVEAUX: Option<Niveau>[] = [
  { valeur: 'primaire', libelle: 'Primaire', detail: 'Trimestres' },
  { valeur: 'college', libelle: 'Collège', detail: 'Trimestres' },
  { valeur: 'lycee', libelle: 'Lycée', detail: 'Trimestres' },
  { valeur: 'universite', libelle: 'Université', detail: 'Semestres' }
];

export interface OptionAlerte {
  cle: keyof AlertesParent;
  libelle: string;
  detail: string;
  /** SMS induits par mois, en moyenne — annoncés avant validation (RM-16). */
  smsParMois: number;
}

/** Les cinq réglages et leurs défauts (RM-16). */
export const ALERTES: OptionAlerte[] = [
  { cle: 'nouvelleNote', libelle: 'Nouvelle note', detail: 'Dès que le professeur publie un devoir noté.', smsParMois: 6 },
  { cle: 'noteSousMoyenne', libelle: 'Note en dessous de 10', detail: 'Seulement quand une note passe sous la moyenne.', smsParMois: 2 },
  { cle: 'controleAnnonce', libelle: 'Contrôle annoncé', detail: 'Avec les chapitres à réviser.', smsParMois: 3 },
  { cle: 'bulletinDisponible', libelle: 'Bulletin disponible', detail: 'Une fois par trimestre.', smsParMois: 0.34 },
  { cle: 'resumeHebdomadaire', libelle: 'Résumé hebdomadaire', detail: 'Un SMS chaque dimanche à 19:00.', smsParMois: 4 }
];

export const ALERTES_PAR_DEFAUT: AlertesParent = {
  nouvelleNote: true,
  noteSousMoyenne: false,
  controleAnnonce: true,
  bulletinDisponible: true,
  resumeHebdomadaire: false
};
