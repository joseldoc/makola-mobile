import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { IconComponent } from '../../foundation/icon/icon';

export type NetworkBannerState = 'offline' | 'synced';

/**
 * Network banner — always informs, never blocks, never closes.
 * Amber offline, green after sync. Mandatory on every entry screen.
 * Source: @makola Design System, components/data/NetworkBanner.jsx.
 */
@Component({
  selector: 'app-network-banner',
  imports: [IconComponent, TranslocoPipe],
  template: `
    <div class="network-banner" role="status" [style.background]="background()" [style.border-bottom-color]="borderColor()">
      <app-icon [name]="state() === 'synced' ? 'cloud-done-outline' : 'cloud-offline-outline'" [size]="16" [color]="color()" />
      <span [style.color]="color()">{{ messageKey() | transloco: { count: pending() } }}</span>
    </div>
  `,
  styleUrl: './network-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkBannerComponent {
  /** `offline` (amber) or `synced` (green). */
  readonly state = input<NetworkBannerState>('offline');
  /** Entries waiting to be sent — say it, it reassures. */
  readonly pending = input(0);

  protected readonly color = computed(() => (this.state() === 'synced' ? 'var(--mk-succes)' : 'var(--mk-attente)'));
  protected readonly background = computed(() => `color-mix(in srgb, ${this.color()} 12%, var(--mk-surface))`);
  protected readonly borderColor = computed(() => `color-mix(in srgb, ${this.color()} 34%, transparent)`);
  protected readonly messageKey = computed(() => {
    if (this.state() === 'synced') return 'network.synced';
    return this.pending() > 0 ? 'network.offlinePending' : 'network.offline';
  });
}
