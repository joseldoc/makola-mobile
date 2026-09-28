import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';
import { IconComponent } from '@core/shared/components/foundation/icon/icon';

import { AuthFlowStore } from '../auth.store';

/**
 * Container de confirmation : l'enfant rattaché s'affiche AVANT validation,
 * pour éviter un rattachement au mauvais élève (US-PA01).
 */
@Component({
  selector: 'app-enfant-page',
  imports: [AppBarComponent, FooterActionComponent, OutlinedButtonComponent, IconComponent],
  templateUrl: './enfant-page.html',
  styleUrls: ['./auth-page.scss', './enfant-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnfantPageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);

  /** « ILUNGA Marie » → « Marie » : le prénom suffit dans une phrase. */
  protected readonly prenom = computed(() => {
    const nom = this.store.invitation()?.eleve ?? '';
    return nom.split(' ').slice(1).join(' ') || nom;
  });

  protected confirmer(): void {
    void this.router.navigateByUrl('/auth/invitation/numero');
  }

  protected retour(): void {
    void this.router.navigateByUrl('/auth/invitation');
  }

  protected refuser(): void {
    this.store.refuserInvitation();
    void this.router.navigateByUrl('/auth/invitation');
  }
}
