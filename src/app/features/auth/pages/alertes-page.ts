import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, form, submit } from '@angular/forms/signals';

import { AlertesParent } from '@core/auth/auth.model';
import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { SwitchComponent } from '@core/shared/components/forms/switch/switch';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { AuthFlowStore } from '../auth.store';
import { ALERTES, ALERTES_PAR_DEFAUT, OptionAlerte } from '../modele';

/**
 * Container des réglages d'alerte, proposés juste après le rattachement et
 * avant le premier accès au fil (US-PA01, RM-16). Le nombre de SMS induits est
 * annoncé avant validation : c'est un coût réel sur le marché cible.
 */
@Component({
  selector: 'app-alertes-page',
  imports: [AppBarComponent, SwitchComponent, FooterActionComponent, FormField],
  templateUrl: './alertes-page.html',
  styleUrls: ['./auth-page.scss', './alertes-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertesPageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);

  protected readonly options = ALERTES;
  protected readonly scrolled = signal(false);

  private readonly modele = signal<AlertesParent>({ ...ALERTES_PAR_DEFAUT });
  protected readonly formulaire = form(this.modele);

  protected readonly prenom = computed(() => {
    const nom = this.store.invitation()?.eleve ?? '';
    return nom.split(' ').slice(1).join(' ') || 'votre enfant';
  });

  protected readonly estimation = computed(() => {
    const reglages = this.modele();
    const sms = Math.round(ALERTES.reduce((total, a) => total + (reglages[a.cle] ? a.smsParMois : 0), 0));
    if (sms === 0) return 'Aucun SMS : vous consulterez le fil vous-même.';
    return `Environ ${sms} SMS par mois avec ces réglages.`;
  });

  protected basculer(option: OptionAlerte): void {
    this.formulaire[option.cle]().value.update((v) => !v);
  }

  protected onScroll(event: Event): void {
    this.scrolled.set((event.currentTarget as HTMLElement).scrollTop > 0);
  }

  protected valider(): void {
    void submit(this.formulaire, async () => {
      if (await this.store.enregistrerAlertes(this.modele())) {
        void this.router.navigateByUrl('/fil-parent', { replaceUrl: true });
      }
      return undefined;
    });
  }
}
