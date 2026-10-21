import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { IconComponent } from '../../foundation/icon/icon';

export type MiniFabIcon = 'remove-outline' | 'add-outline';

/**
 * Round mini-FAB — remove-outline and add-outline only, to step a bounded value.
 * At the bound the glyph fades but the button stays tappable.
 * Source: @makola Design System, components/actions/MiniFab.jsx.
 */
@Component({
  selector: 'app-mini-fab',
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="mini-fab"
      [attr.aria-label]="ariaLabel()"
      (click)="clicked.emit()"
      (pointerdown)="held.set(true)"
      (pointerup)="held.set(false)"
      (pointerleave)="held.set(false)"
      (pointercancel)="held.set(false)"
      [style.background]="held() ? 'var(--mk-touche-presse)' : 'var(--mk-marge)'"
      [style.color]="atBound() ? 'rgba(16,26,46,.32)' : 'var(--mk-primaire)'"
      [style.transform]="held() ? 'scale(var(--mk-echelle-fab))' : 'none'"
    >
      <app-icon [name]="icon()" [size]="18" />
    </button>
  `,
  styleUrl: './mini-fab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniFabComponent {
  /** `remove-outline` or `add-outline` — no other icon. */
  readonly icon = input.required<MiniFabIcon>();
  /** Value at its bound: the icon drops to 32 %, the button stays tappable. */
  readonly atBound = input(false);
  /** Always required: the glyph alone does not say what it changes. */
  readonly ariaLabel = input.required<string>();
  readonly clicked = output<void>();

  protected readonly held = signal(false);
}
