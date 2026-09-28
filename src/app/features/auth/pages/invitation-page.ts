import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { KeypadComponent } from '@core/shared/components/forms/keypad/keypad';

import { CodeSlotsComponent, CodeSlotsEtat } from '../components';
import { AuthFlowStore } from '../auth.store';

const LONGUEUR = 6;

/**
 * Container de l'entrée parent : le code d'invitation à 6 chiffres reçu du
 * professeur (RM-12 — usage unique, 7 jours). Le parent ne crée pas son compte
 * seul : le code le rattache à un élève précis.
 */
@Component({
  selector: 'app-invitation-page',
  imports: [AppBarComponent, KeypadComponent, CodeSlotsComponent],
  templateUrl: './invitation-page.html',
  styleUrls: ['./auth-page.scss'],
  host: { '(document:keydown)': 'clavier($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitationPageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);

  protected readonly code = signal('');
  protected readonly etat = computed<CodeSlotsEtat>(() => {
    if (this.store.enCours()) return 'verification';
    return this.store.erreur() ? 'erreur' : 'repos';
  });

  constructor() {
    // Un refus d'enfant (écran suivant) revient ici avec son message : on le garde.
    if (!this.store.erreur()) this.store.commencer('invitation');
  }

  protected chiffre(c: string): void {
    if (this.store.enCours() || this.code().length >= LONGUEUR) return;
    this.store.effacerErreur();
    this.code.update((v) => v + c);
    if (this.code().length === LONGUEUR) void this.verifier();
  }

  protected effacer(): void {
    if (!this.store.enCours()) this.code.update((v) => v.slice(0, -1));
  }

  protected clavier(event: KeyboardEvent): void {
    if (/^\d$/.test(event.key)) this.chiffre(event.key);
    else if (event.key === 'Backspace') this.effacer();
  }

  protected retour(): void {
    void this.router.navigateByUrl('/auth');
  }

  private async verifier(): Promise<void> {
    if (await this.store.verifierInvitation(this.code())) {
      void this.router.navigateByUrl('/auth/invitation/enfant');
    } else {
      this.code.set('');
    }
  }
}
