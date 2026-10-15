import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ROLE_TINTS, SurfaceRole } from '../../../roles';

/**
 * M3 tonal header — two round shapes spilling out of the frame, never a gradient.
 * One per screen, always at the top.
 * Source: @makola Design System, components/data/TonalHeader.jsx.
 */
@Component({
  selector: 'app-tonal-header',
  template: `
    <div class="tonal-header" [class.compact]="compact()" [class.full-bleed]="fullBleed()" [style.background]="tint()[0]">
      <div class="shape shape-top" [style.background]="tint()[1]"></div>
      <div class="shape shape-bottom" [style.background]="tint()[1]"></div>
      <div class="content">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './tonal-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TonalHeaderComponent {
  readonly role = input<SurfaceRole>('teacher');
  /** Reduced padding — for a header under an app bar. */
  readonly compact = input(false);
  /** Header at the top of a screen without app bar: the tint runs under the status bar. */
  readonly fullBleed = input(false);

  protected readonly tint = computed(() => ROLE_TINTS[this.role()]);
}
