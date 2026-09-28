import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { FormCheckboxControl } from '@angular/forms/signals';

import { IconComponent } from '../../foundation/icon/icon';

export type SwitchTone = 'primaire' | 'attente' | 'succes';

const TONE_COLOR: Record<SwitchTone, string> = {
  primaire: 'var(--mk-primaire)',
  attente: 'var(--mk-attente)',
  succes: 'var(--mk-succes)'
};

/**
 * Interrupteur M3, 52 × 32 dp. La poignée passe de 16 à 24 dp avec une coche :
 * c'est la transition qui porte le changement, pas un libellé « ON ».
 * Source: @makola Design System, components/forms/Switch.jsx.
 *
 * Contrôle de formulaire signal (`FormCheckboxControl`) : se lie par `[formField]`,
 * ou à la main par `[checked]` / `(checkedChange)`.
 */
@Component({
  selector: 'app-switch',
  imports: [IconComponent],
  template: `
    <div
      class="switch"
      role="switch"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="ariaLabel() || null"
      [class.checked]="checked()"
      [style.background]="checked() ? color() : 'var(--mk-marge)'"
      [style.border-color]="checked() ? color() : 'var(--mk-contour-fort)'"
      (click)="checked.set(!checked())"
    >
      <div
        class="thumb"
        [style.left.px]="checked() ? 22 : 6"
        [style.width.px]="checked() ? 24 : 16"
        [style.height.px]="checked() ? 24 : 16"
        [style.margin-top.px]="checked() ? -12 : -8"
        [style.background]="checked() ? 'var(--mk-surface)' : 'var(--mk-contour-fort)'"
        [style.color]="color()"
      >
        @if (checked()) {
          <app-icon name="checkmark-outline" [size]="14" [color]="color()" />
        }
      </div>
    </div>
  `,
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchComponent implements FormCheckboxControl {
  readonly checked = model.required<boolean>();
  /** `attente` (ambre) sur les écrans parent, `primaire` ailleurs. */
  readonly tone = input<SwitchTone>('primaire');
  readonly ariaLabel = input<string>();

  protected readonly color = computed(() => TONE_COLOR[this.tone()]);
}
