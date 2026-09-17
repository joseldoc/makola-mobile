import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { IconComponent } from '../../foundation/icon/icon';

export type NetworkBannerState = 'horsligne' | 'synchronise';

/**
 * Bandeau réseau — informe toujours, ne bloque jamais, ne se ferme pas.
 * Ambre hors-ligne, vert après synchronisation. Obligatoire sur tout écran de saisie.
 * Source: @makola Design System, components/data/NetworkBanner.jsx.
 */
@Component({
  selector: 'app-network-banner',
  imports: [IconComponent],
  template: `
    <div class="network-banner" role="status" [style.background]="bg()" [style.border-bottom-color]="borderColor()">
      <app-icon [name]="state() === 'synchronise' ? 'cloud-done-outline' : 'cloud-offline-outline'" [size]="16" [color]="color()" />
      <span [style.color]="color()">{{ texte() }}</span>
    </div>
  `,
  styleUrl: './network-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkBannerComponent {
  /** `horsligne` (ambre) ou `synchronise` (vert). */
  readonly state = input<NetworkBannerState>('horsligne');
  /** Nombre de saisies en attente — annoncez-le, il rassure. */
  readonly pending = input(0);
  readonly syncedLabel = input('');

  protected readonly color = computed(() => (this.state() === 'synchronise' ? 'var(--mk-succes)' : 'var(--mk-attente)'));
  protected readonly bg = computed(() => `color-mix(in srgb, ${this.color()} 12%, var(--mk-surface))`);
  protected readonly borderColor = computed(() => `color-mix(in srgb, ${this.color()} 34%, transparent)`);
  protected readonly texte = computed(() => {
    if (this.state() === 'synchronise') return this.syncedLabel() || 'Tout est synchronisé.';
    if (this.pending() > 0) {
      return `Hors ligne · ${this.pending()} saisie(s) en attente d'envoi. Vous pouvez continuer.`;
    }
    return "Hors ligne · la saisie fonctionne, l'envoi partira au retour du réseau.";
  });
}
