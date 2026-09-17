import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { TextFieldComponent } from '@core/shared/components/forms/text-field/text-field';
import { MiniFabComponent } from '@core/shared/components/actions/mini-fab/mini-fab';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { Bareme } from '../modele';
import { DevoirStore } from '../devoir.store';

const BAREMES: Bareme[] = ['/20', '/10', '/5'];

/**
 * Feuille modale de création de devoir — validation par champ (RM-13, RM-14),
 * bouton qui dit ce qui manque plutôt qu'un « Valider » grisé.
 * Source: @makola Design System, ui_kits/app/DevoirSheet.jsx.
 */
@Component({
  selector: 'app-devoir-page',
  imports: [TextFieldComponent, MiniFabComponent, OutlinedButtonComponent, FooterActionComponent],
  templateUrl: './devoir-page.html',
  styleUrl: './devoir-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DevoirPageComponent {
  protected readonly store = inject(DevoirStore);
  private readonly router = inject(Router);

  protected readonly baremes = BAREMES;

  protected fermer(): void {
    void this.router.navigate(['/classe']);
  }

  protected creer(): void {
    if (this.store.bloque()) return;
    void this.router.navigate(['/saisie']);
  }
}
