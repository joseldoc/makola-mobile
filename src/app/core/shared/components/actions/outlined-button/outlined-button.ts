import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { ROLE_TINTS, SurfaceRole } from '../../../roles';

/**
 * M2 outlined button — in a list row or a content block.
 * No disabled state: a row button that does nothing is not shown.
 * Source: @makola Design System, components/actions/OutlinedButton.jsx.
 */
@Component({
  selector: 'app-outlined-button',
  template: `
    <button
      type="button"
      class="outlined-button"
      [class.full]="full()"
      (click)="clicked.emit()"
      (pointerdown)="held.set(true)"
      (pointerup)="held.set(false)"
      (pointerleave)="held.set(false)"
      (pointercancel)="held.set(false)"
      [style.background]="held() ? toneBackground() : 'transparent'"
    ><span class="label">{{ label() }}</span></button>
  `,
  styleUrl: './outlined-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OutlinedButtonComponent {
  /** Short: it is uppercased and must fit on one line. */
  readonly label = input.required<string>();
  /** Pressed background — the tint of the screen's role. */
  readonly tone = input<SurfaceRole>('teacher');
  /** `true` to share the width with its siblings in a flex row, or fill a column. */
  readonly full = input(false);
  readonly clicked = output<void>();

  protected readonly held = signal(false);
  protected readonly toneBackground = computed(() => ROLE_TINTS[this.tone()][0]);
}
