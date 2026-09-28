import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, form, submit, validate } from '@angular/forms/signals';

import { Canal, Intention } from '@core/auth/auth.model';
import { creerIdentifiant, normaliserTelephone, TELEPHONE_MOBILE } from '@core/auth/identifiant';
import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { TabItem, TabsComponent } from '@core/shared/components/navigation/tabs/tabs';
import { TextFieldComponent } from '@core/shared/components/forms/text-field/text-field';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { AuthFlowStore } from '../auth.store';

const CANAUX: TabItem[] = [
  { id: 'telephone', label: 'Téléphone' },
  { id: 'email', label: 'Email' }
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const TEXTES: Record<Intention, { titre: string; sousTitre: string; intro: string }> = {
  inscription: {
    titre: 'Créer un compte',
    sousTitre: 'Étape 1 sur 3 · Identifiant',
    intro:
      'Saisissez le numéro ou l\'adresse que vos établissements connaissent. Un code à 6 chiffres vous sera envoyé : aucun mot de passe à retenir.'
  },
  connexion: {
    titre: 'Se connecter',
    sousTitre: 'Code à usage unique',
    intro: 'Saisissez le numéro ou l\'adresse de votre compte. Un code à 6 chiffres vous sera envoyé.'
  },
  invitation: {
    titre: 'Votre numéro',
    sousTitre: 'Étape 2 sur 3 · Compte parent',
    intro: 'Votre compte parent se crée avec ce numéro. Un code de confirmation vous sera envoyé.'
  }
};

/**
 * Container de l'étape « identifiant » : email **ou** téléphone (US-P01), sans
 * mot de passe. Formulaire signal ; le refus du serveur s'affiche sous le champ.
 */
@Component({
  selector: 'app-identifiant-page',
  imports: [AppBarComponent, TabsComponent, TextFieldComponent, FooterActionComponent, FormField],
  templateUrl: './identifiant-page.html',
  styleUrls: ['./auth-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentifiantPageComponent implements OnInit {
  /** Fournie par la route (`data`). */
  readonly intention = input.required<Intention>();

  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);

  protected readonly canaux = CANAUX;
  protected readonly canal = signal<Canal>('telephone');
  protected readonly textes = computed(() => TEXTES[this.intention()]);
  protected readonly role = computed(() => (this.intention() === 'invitation' ? 'parent' : 'prof'));

  private readonly modele = signal({ valeur: '' });
  protected readonly formulaire = form(this.modele, (p) => {
    validate(p.valeur, ({ value }) => {
      const v = value().trim();
      if (this.canal() === 'telephone') {
        if (!v) return { kind: 'requis', message: 'Saisissez votre numéro pour recevoir le code.' };
        if (!TELEPHONE_MOBILE.test(normaliserTelephone(v))) {
          return {
            kind: 'format',
            message: 'Un numéro mobile compte 9 chiffres et commence par 04, 05 ou 06 — par exemple 06 612 34 56.'
          };
        }
        return null;
      }
      if (!v) return { kind: 'requis', message: 'Saisissez votre adresse pour recevoir le code.' };
      if (!EMAIL.test(v)) {
        return { kind: 'format', message: "Il manque une partie de l'adresse : elle prend la forme prenom.nom@exemple.cg." };
      }
      return null;
    });
  });

  /** Le bouton dit ce qui manque — jamais un « Recevoir le code » grisé. */
  protected readonly manque = computed(() => {
    if (this.store.enCours()) return 'Envoi du code…';
    const erreur = this.formulaire.valeur().errors()[0];
    const quoi = this.canal() === 'telephone' ? 'votre numéro' : 'votre adresse';
    if (!erreur) return '';
    return erreur.kind === 'requis' ? `Saisissez ${quoi}` : `Corrigez ${quoi}`;
  });

  constructor() {
    // Toute nouvelle saisie efface le refus précédent du serveur.
    effect(() => {
      this.modele();
      untracked(() => this.store.effacerErreur());
    });
  }

  ngOnInit(): void {
    this.store.commencer(this.intention());
  }

  protected changerCanal(id: string | number): void {
    this.canal.set(id as Canal);
    this.formulaire().reset({ valeur: '' });
  }

  protected envoyer(event?: Event): void {
    event?.preventDefault();
    void submit(this.formulaire, async () => {
      const identifiant = creerIdentifiant(this.canal(), this.modele().valeur);
      if (await this.store.demanderCode(identifiant)) {
        void this.router.navigateByUrl('/auth/code');
      }
      return undefined;
    });
  }

  protected retour(): void {
    void this.router.navigateByUrl(this.intention() === 'invitation' ? '/auth/invitation/enfant' : '/auth');
  }
}
