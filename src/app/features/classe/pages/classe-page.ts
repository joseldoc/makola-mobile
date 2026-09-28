import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AppBarAction, AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { TabItem, TabsComponent } from '@core/shared/components/navigation/tabs/tabs';
import { ListRowComponent } from '@core/shared/components/data/list-row/list-row';
import { NetworkBannerComponent } from '@core/shared/components/data/network-banner/network-banner';
import { SearchFieldComponent } from '@core/shared/components/forms/search-field/search-field';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { SessionStore } from '@core/store/session/session.store';

import { ClasseStore } from '../classe.store';

const VUES: TabItem[] = [
  { id: 0, label: 'Devoirs' },
  { id: 1, label: 'Élèves' },
  { id: 2, label: 'Bulletin' }
];

const ACTIONS_BARRE: AppBarAction[] = [
  { icon: 'search-outline', label: 'Rechercher' },
  { icon: 'log-out-outline', label: 'Se déconnecter' }
];
const ACTION_DECONNEXION = 1;

/**
 * Container de l'écran classe (liste des devoirs / élèves / bulletin).
 * Toute la logique et les appels au store vivent ici — les enfants (AppBar,
 * Tabs, ListRow…) restent des composants de présentation.
 * Source: @makola Design System, ui_kits/app/ClasseScreen.jsx.
 */
@Component({
  selector: 'app-classe-page',
  imports: [AppBarComponent, TabsComponent, ListRowComponent, NetworkBannerComponent, SearchFieldComponent, FooterActionComponent],
  templateUrl: './classe-page.html',
  styleUrl: './classe-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassePageComponent {
  protected readonly store = inject(ClasseStore);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);

  protected readonly vues = VUES;
  protected readonly actionsBarre = ACTIONS_BARRE;

  protected onVueChange(id: string | number): void {
    this.store.setVue(Number(id));
  }

  protected onScroll(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    this.store.setScrolled(target.scrollTop > 0);
  }

  protected saisir(): void {
    void this.router.navigate(['/saisie']);
  }

  protected onAction(index: number): void {
    if (index === ACTION_DECONNEXION) this.deconnecter();
  }

  protected nouveauDevoir(): void {
    void this.router.navigate(['/devoir/nouveau']);
  }

  /** Ferme la session et revient à l'accueil ; la présentation ne se rejoue pas. */
  private deconnecter(): void {
    this.session.fermer();
    void this.router.navigateByUrl('/auth', { replaceUrl: true });
  }
}
