/** Les deux rôles du MVP (cahier des charges §8). */
export type Role = 'prof' | 'parent';

/** Email **ou** téléphone — jamais de mot de passe : l'accès passe par un code (US-P01). */
export type Canal = 'telephone' | 'email';

export interface Identifiant {
  canal: Canal;
  /** Normalisée : 9 chiffres (« 066123456 ») ou email en minuscules. */
  valeur: string;
}

/** Pourquoi un code est demandé — change les refus opposables. */
export type Intention = 'inscription' | 'connexion' | 'invitation';

export interface DemandeCode {
  /** Délai anti-spam avant de pouvoir redemander un code, en secondes. */
  renvoiDans: number;
}

export type Niveau = 'primaire' | 'college' | 'lycee' | 'universite';

/** Étape 2 obligatoire de l'inscription enseignant (US-P01). */
export interface ProfilProfesseur {
  nom: string;
  matieres: string[];
  niveaux: Niveau[];
  /** Quartier et ville — jamais l'adresse exacte (RM-07). */
  zone: string;
}

/** Invitation parent : code à 6 chiffres, usage unique, 7 jours (RM-12). */
export interface Invitation {
  code: string;
  eleve: string;
  classe: string;
  etablissement: string;
  professeur: string;
  matiere: string;
}

/** Les cinq réglages d'alerte du parent (RM-16). */
export interface AlertesParent {
  nouvelleNote: boolean;
  noteSousMoyenne: boolean;
  controleAnnonce: boolean;
  bulletinDisponible: boolean;
  resumeHebdomadaire: boolean;
}

export interface Session {
  id: string;
  role: Role;
  identifiant: Identifiant;
  nom?: string;
  /** Faux tant que l'étape 2 (profil enseignant, alertes parent) n'est pas terminée. */
  profilComplet: boolean;
}
