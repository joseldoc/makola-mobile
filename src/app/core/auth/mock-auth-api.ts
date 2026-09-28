import { Injectable } from '@angular/core';

import { AuthApi, AuthErreur } from './auth-api';
import { AlertesParent, DemandeCode, Identifiant, Intention, Invitation, ProfilProfesseur, Session } from './auth.model';
import { libelleIdentifiant } from './identifiant';

/** Code accepté par le serveur simulé — toute autre saisie est refusée. */
export const CODE_DEMO = '123456';

/** Invitation reconnue par le serveur simulé (données du UI kit @makola). */
const INVITATIONS: Record<string, Omit<Invitation, 'code'>> = {
  '482913': {
    eleve: 'ILUNGA Marie',
    classe: '4ème B',
    etablissement: 'Lycée Chaminade',
    professeur: 'M. NKOUKA',
    matiere: 'Mathématiques'
  }
};

const LATENCE_MS = 700;
const RENVOI_S = 45;
const CLE_COMPTES = 'mk.mock.comptes';

type Comptes = Record<string, Session>;

/**
 * Serveur d'authentification simulé — ce dépôt n'a pas encore de backend.
 * Les comptes créés sont gardés dans le `localStorage` pour que la connexion
 * retrouve une inscription précédente. Code OTP : {@link CODE_DEMO}.
 * Invitation parent : 482913.
 */
@Injectable()
export class MockAuthApi extends AuthApi {
  async demanderCode(identifiant: Identifiant, intention: Intention): Promise<DemandeCode> {
    await this.reseau();
    const compte = this.comptes()[this.cle(identifiant)];
    const qui = libelleIdentifiant(identifiant);
    const quoi = identifiant.canal === 'telephone' ? 'ce numéro' : 'cette adresse';

    if (intention === 'inscription' && compte) {
      throw new AuthErreur('compte-existant', `Un compte utilise déjà ${qui}. Connectez-vous avec ${quoi}.`);
    }
    if (intention === 'connexion' && !compte) {
      throw new AuthErreur('compte-inconnu', `Aucun compte n'utilise ${qui}. Vérifiez la saisie, ou créez un compte.`);
    }
    console.info(`[MockAuthApi] Code envoyé à ${qui} : ${CODE_DEMO}`);
    return { renvoiDans: RENVOI_S };
  }

  async verifierCode(identifiant: Identifiant, code: string, intention: Intention, invitation?: Invitation): Promise<Session> {
    await this.reseau();
    if (code !== CODE_DEMO) {
      throw new AuthErreur('code-incorrect', 'Ce code ne correspond pas à celui envoyé. Vérifiez le message, ou demandez un nouveau code.');
    }
    const comptes = this.comptes();
    const cle = this.cle(identifiant);
    const existant = comptes[cle];
    if (existant && intention !== 'invitation') return existant;

    const session: Session = existant ?? {
      id: crypto.randomUUID(),
      role: intention === 'invitation' ? 'parent' : 'prof',
      identifiant,
      profilComplet: false
    };
    if (invitation) console.info(`[MockAuthApi] ${cle} rattaché à ${invitation.eleve}.`);
    // Un parent qui rejoint une nouvelle invitation règle ses alertes pour cet enfant.
    const ouverte = intention === 'invitation' ? { ...session, profilComplet: false } : session;
    this.enregistrer({ ...comptes, [cle]: ouverte });
    return ouverte;
  }

  async completerProfil(session: Session, profil: ProfilProfesseur): Promise<Session> {
    await this.reseau();
    return this.mettreAJour({ ...session, nom: profil.nom, profilComplet: true });
  }

  async verifierInvitation(code: string): Promise<Invitation> {
    await this.reseau();
    const invitation = INVITATIONS[code];
    if (!invitation) {
      throw new AuthErreur(
        'invitation-inconnue',
        'Ce code ne correspond à aucune invitation en cours. Vérifiez le SMS reçu, ou demandez un nouveau code au professeur.'
      );
    }
    return { code, ...invitation };
  }

  async enregistrerAlertes(session: Session, _alertes: AlertesParent): Promise<Session> {
    await this.reseau();
    return this.mettreAJour({ ...session, profilComplet: true });
  }

  private async reseau(): Promise<void> {
    await new Promise((r) => setTimeout(r, LATENCE_MS));
    if (!navigator.onLine) {
      throw new AuthErreur('hors-ligne', "Hors ligne · l'envoi et la vérification du code demandent le réseau. Réessayez à son retour.");
    }
  }

  private mettreAJour(session: Session): Session {
    this.enregistrer({ ...this.comptes(), [this.cle(session.identifiant)]: session });
    return session;
  }

  private cle(identifiant: Identifiant): string {
    return `${identifiant.canal}:${identifiant.valeur}`;
  }

  private comptes(): Comptes {
    try {
      return JSON.parse(localStorage.getItem(CLE_COMPTES) ?? '{}') as Comptes;
    } catch {
      return {};
    }
  }

  private enregistrer(comptes: Comptes): void {
    try {
      localStorage.setItem(CLE_COMPTES, JSON.stringify(comptes));
    } catch {
      // Stockage indisponible (navigation privée) : la session reste valable en mémoire.
    }
  }
}
