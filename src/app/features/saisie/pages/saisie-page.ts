import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { ListRowComponent, ListRowValueTone } from '@core/shared/components/data/list-row/list-row';
import { NetworkBannerComponent } from '@core/shared/components/data/network-banner/network-banner';
import { KeypadComponent } from '@core/shared/components/forms/keypad/keypad';

import { SaisieStore } from '../saisie.store';

/**
 * Container de l'écran de saisie de notes — pavé numérique dédié, ligne
 * active, flash de confirmation, bandeau hors-ligne.
 * Source: @makola Design System, ui_kits/app/SaisieScreen.jsx.
 */
@Component({
  selector: 'app-saisie-page',
  imports: [AppBarComponent, ListRowComponent, NetworkBannerComponent, KeypadComponent],
  templateUrl: './saisie-page.html',
  styleUrl: './saisie-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaisiePageComponent {
  protected readonly store = inject(SaisieStore);
  private readonly router = inject(Router);

  protected retour(): void {
    void this.router.navigate(['/classe']);
  }

  protected valueTone(note: string): ListRowValueTone {
    if (!note) return 'neutre';
    const n = parseFloat(note.replace(',', '.'));
    return !Number.isNaN(n) && n < 10 ? 'refus' : 'neutre';
  }
}
