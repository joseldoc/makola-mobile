import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { FormCheckboxControl } from '@angular/forms/signals';

import { IconComponent } from '../../foundation/icon/icon';

export type SwitchTone = 'primary' | 'pending' | 'success';

const TONE_COLOR: Record<SwitchTone, string> = {
  primary: 'var(--mk-primaire)',
  pending: 'var(--mk-attente)',
  success: 'var(--mk-succes)'
};

/**
 * M3 switch, 52 × 32 dp. The handle grows from 16 to 24 dp with a check mark:
 * the transition carries the change, not an "ON" label.
 * Source: @makola Design System, components/forms/Switch.jsx.
 *
 * Signal forms control (`FormCheckboxControl`): bind it with `[formField]`,
 * or by hand with `[checked]` / `(checkedChange)`.
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
  /** `pending` (amber) on parent screens, `primary` elsewhere. */
  readonly tone = input<SwitchTone>('primary');
  readonly ariaLabel = input<string>();

  protected readonly color = computed(() => TONE_COLOR[this.tone()]);
}
