import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { Intention } from '@core/auth/auth.model';
import { LogoComponent } from '@core/shared/components/brand/logo/logo';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';

import { AuthFlowStore } from '../auth.store';

/**
 * Accueil — là où le produit se nomme : la marque, ce qu'il fait, et trois
 * portes. L'enseignant crée un compte ou se connecte ; le parent n'a pas de
 * compte à créer seul : il entre par le code reçu du professeur (RM-12).
 */
@Component({
  selector: 'app-accueil-page',
  imports: [LogoComponent, FooterActionComponent, OutlinedButtonComponent],
  templateUrl: './accueil-page.html',
  styleUrls: ['./auth-page.scss', './accueil-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccueilPageComponent {
  private readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);

  protected ouvrir(intention: Intention): void {
    this.store.commencer(intention);
    const chemin = { inscription: '/auth/inscription', connexion: '/auth/connexion', invitation: '/auth/invitation' }[intention];
    void this.router.navigateByUrl(chemin);
  }
}
