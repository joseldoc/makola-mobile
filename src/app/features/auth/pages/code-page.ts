import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { libelleIdentifiant } from '@core/auth/identifiant';
import { SessionStore } from '@core/store/session/session.store';
import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { KeypadComponent } from '@core/shared/components/forms/keypad/keypad';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';

import { CodeSlotsComponent, CodeSlotsEtat } from '../components';
import { AuthFlowStore } from '../auth.store';

const LONGUEUR = 6;

/**
 * Container de l'étape « code » : 6 chiffres au pavé dédié (le clavier système
 * ne s'ouvre pas), vérification dès le sixième chiffre, renvoi après le délai
 * anti-spam (US-P01). Un refus vide les cases et dit quoi faire.
 */
@Component({
  selector: 'app-code-page',
  imports: [AppBarComponent, KeypadComponent, OutlinedButtonComponent, CodeSlotsComponent],
  templateUrl: './code-page.html',
  styleUrls: ['./auth-page.scss'],
  host: { '(document:keydown)': 'clavier($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodePageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly code = signal('');
  private readonly maintenant = signal(Date.now());

  protected readonly role = computed(() => (this.store.intention() === 'invitation' ? 'parent' : 'prof'));
  protected readonly sousTitre = computed(() => {
    const intention = this.store.intention();
    if (intention === 'inscription') return 'Étape 2 sur 3 · Confirmation';
    if (intention === 'invitation') return 'Étape 3 sur 3 · Confirmation';
    return 'Connexion';
  });
  protected readonly destination = computed(() => {
    const id = this.store.identifiant();
    if (!id) return '';
    return id.canal === 'telephone' ? `par SMS au ${libelleIdentifiant(id)}` : `par email à ${libelleIdentifiant(id)}`;
  });
  protected readonly etat = computed<CodeSlotsEtat>(() => {
    if (this.store.enCours()) return 'verification';
    return this.store.erreur() ? 'erreur' : 'repos';
  });
  /** Secondes avant de pouvoir redemander un code. */
  protected readonly attente = computed(() => Math.max(0, Math.ceil((this.store.renvoiPossibleLe() - this.maintenant()) / 1000)));
  protected readonly attenteLibelle = computed(() => {
    const s = this.attente();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });

  constructor() {
    const minuterie = setInterval(() => this.maintenant.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(minuterie));
  }

  protected chiffre(c: string): void {
    if (this.store.enCours() || this.code().length >= LONGUEUR) return;
    this.store.effacerErreur();
    this.code.update((v) => v + c);
    if (this.code().length === LONGUEUR) void this.verifier();
  }

  protected effacer(): void {
    if (this.store.enCours()) return;
    this.code.update((v) => v.slice(0, -1));
  }

  protected async renvoyer(): Promise<void> {
    this.code.set('');
    await this.store.renvoyerCode();
  }

  protected modifier(): void {
    const chemin = { inscription: '/auth/inscription', connexion: '/auth/connexion', invitation: '/auth/invitation/numero' };
    void this.router.navigateByUrl(chemin[this.store.intention()]);
  }

  /** Clavier physique (web, tablette avec clavier) : chiffres et effacement. */
  protected clavier(event: KeyboardEvent): void {
    if (/^\d$/.test(event.key)) this.chiffre(event.key);
    else if (event.key === 'Backspace') this.effacer();
  }

  private async verifier(): Promise<void> {
    const session = await this.store.verifierCode(this.code());
    if (session) {
      void this.router.navigateByUrl(this.session.routeInitiale(), { replaceUrl: true });
    } else {
      this.code.set('');
    }
  }
}
