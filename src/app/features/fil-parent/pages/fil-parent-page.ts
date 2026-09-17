import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AppBarAction, AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { ListRowComponent } from '@core/shared/components/data/list-row/list-row';
import { SwitchComponent } from '@core/shared/components/forms/switch/switch';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';

import { FilParentStore } from '../fil-parent.store';

// `chevron-down-outline` — équivaut à `ICONS.deplier` (@core/shared/icons). La
// source (FilParentScreen.jsx) référence `ICONS.deplier` sans l'importer :
// bug du composant de référence, corrigé ici par la valeur littérale correcte.
const ACTIONS_BARRE: AppBarAction[] = [{ icon: 'chevron-down-outline', label: "Changer d'enfant" }];

/**
 * Container du fil parent — rôle ambre, encadrés de moyenne, interrupteur
 * d'alerte, boutons M2 jumeaux. Point d'entrée séparé, autre rôle, autre teinte.
 * Source: @makola Design System, ui_kits/app/FilParentScreen.jsx.
 */
@Component({
  selector: 'app-fil-parent-page',
  imports: [AppBarComponent, ListRowComponent, SwitchComponent, OutlinedButtonComponent],
  templateUrl: './fil-parent-page.html',
  styleUrl: './fil-parent-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilParentPageComponent {
  protected readonly store = inject(FilParentStore);
  protected readonly actionsBarre = ACTIONS_BARRE;

  protected onScroll(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    this.store.setScrolled(target.scrollTop > 0);
  }

  protected changerEnfant(): void {
    // Naviguera vers le sélecteur d'enfant une fois ce point d'entrée construit.
  }
}
