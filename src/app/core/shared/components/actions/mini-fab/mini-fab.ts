import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { IconComponent } from '../../foundation/icon/icon';

export type MiniFabIcon = 'remove-outline' | 'add-outline';

/**
 * Mini-FAB rond — uniquement remove-outline et add-outline, pour incrémenter
 * une valeur bornée. À la borne, le glyphe pâlit mais le bouton reste tapable.
 * Source: @makola Design System, components/actions/MiniFab.jsx.
 */
@Component({
  selector: 'app-mini-fab',
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="mini-fab"
      [attr.aria-label]="ariaLabel() || (icon() === 'add-outline' ? 'Augmenter' : 'Diminuer')"
      (click)="clicked.emit()"
      (pointerdown)="held.set(true)"
      (pointerup)="held.set(false)"
      (pointerleave)="held.set(false)"
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
  /** `remove-outline` ou `add-outline` — pas d'autre icône. */
  readonly icon = input.required<MiniFabIcon>();
  /** Valeur à sa borne : l'icône passe à 32 %, le bouton reste tapable. */
  readonly atBound = input(false);
  readonly ariaLabel = input<string>();
  readonly clicked = output<void>();

  protected readonly held = signal(false);
}
