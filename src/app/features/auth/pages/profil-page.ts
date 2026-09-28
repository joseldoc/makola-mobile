import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, form, submit, validate } from '@angular/forms/signals';

import { Niveau, ProfilProfesseur } from '@core/auth/auth.model';
import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { TextFieldComponent } from '@core/shared/components/forms/text-field/text-field';
import { CheckboxComponent } from '@core/shared/components/forms/checkbox/checkbox';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { AuthFlowStore } from '../auth.store';
import { MATIERES, NIVEAUX } from '../modele';

/** Ce qui manque, dit sur le bouton — dans l'ordre de l'écran. */
const MANQUE: Record<string, string> = {
  nom: 'Saisissez votre nom',
  matieres: 'Choisissez au moins une matière',
  niveaux: 'Choisissez au moins un niveau',
  zone: 'Indiquez votre zone'
};

/**
 * Container de l'étape 2 obligatoire de l'inscription enseignant (US-P01) :
 * matières, niveaux, zone. Le compte n'est actif qu'une fois elle terminée.
 */
@Component({
  selector: 'app-profil-page',
  imports: [AppBarComponent, TextFieldComponent, CheckboxComponent, FooterActionComponent, FormField],
  templateUrl: './profil-page.html',
  styleUrls: ['./auth-page.scss', './profil-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilPageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);

  protected readonly matieres = MATIERES;
  protected readonly niveaux = NIVEAUX;
  protected readonly scrolled = signal(false);

  private readonly modele = signal<ProfilProfesseur>({ nom: '', matieres: [], niveaux: [], zone: '' });
  protected readonly formulaire = form(this.modele, (p) => {
    validate(p.nom, ({ value }) =>
      value().trim().length < 3
        ? { kind: 'nom', message: 'Saisissez votre nom et votre prénom, tels que les parents les liront.' }
        : null
    );
    validate(p.matieres, ({ value }) => (value().length ? null : { kind: 'matieres', message: MANQUE['matieres'] }));
    validate(p.niveaux, ({ value }) => (value().length ? null : { kind: 'niveaux', message: MANQUE['niveaux'] }));
    validate(p.zone, ({ value }) =>
      value().trim().length < 3
        ? { kind: 'zone', message: 'Indiquez votre quartier et votre ville, par exemple « Bacongo, Brazzaville ».' }
        : null
    );
  });

  protected readonly manque = computed(() => {
    if (this.store.enCours()) return 'Activation du compte…';
    const f = this.formulaire;
    const champ = [f.nom, f.matieres, f.niveaux, f.zone].find((c) => c().invalid());
    const erreur = champ?.().errors()[0];
    return erreur ? (MANQUE[erreur.kind] ?? 'Complétez le profil') : '';
  });

  protected estMatiere(valeur: string): boolean {
    return this.modele().matieres.includes(valeur);
  }

  protected estNiveau(valeur: Niveau): boolean {
    return this.modele().niveaux.includes(valeur);
  }

  protected basculerMatiere(valeur: string): void {
    this.formulaire.matieres().value.update((liste) => basculer(liste, valeur));
  }

  protected basculerNiveau(valeur: Niveau): void {
    this.formulaire.niveaux().value.update((liste) => basculer(liste, valeur));
  }

  protected onScroll(event: Event): void {
    this.scrolled.set((event.currentTarget as HTMLElement).scrollTop > 0);
  }

  protected activer(event?: Event): void {
    event?.preventDefault();
    void submit(this.formulaire, async () => {
      const profil = this.modele();
      if (await this.store.completerProfil({ ...profil, nom: profil.nom.trim(), zone: profil.zone.trim() })) {
        void this.router.navigateByUrl('/classe', { replaceUrl: true });
      }
      return undefined;
    });
  }
}

function basculer<T>(liste: T[], valeur: T): T[] {
  return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
}
