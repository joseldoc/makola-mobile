import { AlertesParent, DemandeCode, Identifiant, Intention, Invitation, ProfilProfesseur, Session } from './auth.model';

export type AuthErreurCode =
  | 'compte-inconnu'
  | 'compte-existant'
  | 'code-incorrect'
  | 'invitation-inconnue'
  | 'hors-ligne';

/**
 * Refus opposable par le serveur. `message` est affichable tel quel : il dit
 * toujours ce que l'utilisateur peut faire (contrat d'interface §7.6).
 */
export class AuthErreur extends Error {
  constructor(
    readonly code: AuthErreurCode,
    message: string
  ) {
    super(message);
  }
}

/**
 * Contrat d'accès au serveur d'authentification. Fourni dans `app.config.ts` :
 * aujourd'hui `MockAuthApi`, demain l'implémentation HTTP — aucun écran ne change.
 * Toute méthode rejette avec une `AuthErreur`.
 */
export abstract class AuthApi {
  /** Envoie un code à 6 chiffres par SMS ou email. */
  abstract demanderCode(identifiant: Identifiant, intention: Intention): Promise<DemandeCode>;

  /** Vérifie le code et ouvre une session. `invitation` rattache le parent à l'enfant. */
  abstract verifierCode(identifiant: Identifiant, code: string, intention: Intention, invitation?: Invitation): Promise<Session>;

  /** Étape 2 de l'inscription enseignant : le compte n'est actif qu'après elle. */
  abstract completerProfil(session: Session, profil: ProfilProfesseur): Promise<Session>;

  /** Montre l'enfant rattaché AVANT validation (US-PA01). */
  abstract verifierInvitation(code: string): Promise<Invitation>;

  /** Réglages d'alerte proposés avant le premier accès au fil (RM-16). */
  abstract enregistrerAlertes(session: Session, alertes: AlertesParent): Promise<Session>;
}
