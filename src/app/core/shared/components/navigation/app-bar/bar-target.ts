import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { IconComponent } from '../../foundation/icon/icon';

/**
 * Cible ronde de 48 dp — toute action de barre d'app passe par elle.
 * Source: @makola Design System, components/navigation/AppBar.jsx (`BarTarget`).
 */
@Component({
  selector: 'app-bar-target',
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="bar-target"
      [attr.aria-label]="label()"
      (click)="clicked.emit()"
      (pointerdown)="held.set(true)"
      (pointerup)="held.set(false)"
      (pointerleave)="held.set(false)"
      [style.background]="held() ? tone() : 'transparent'"
    >
      <app-icon [name]="icon()" [size]="22" />
    </button>
  `,
  styleUrl: './bar-target.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarTargetComponent {
  readonly icon = input.required<string>();
  readonly tone = input.required<string>();
  readonly label = input<string>();
  readonly clicked = output<void>();

  protected readonly held = signal(false);
}
