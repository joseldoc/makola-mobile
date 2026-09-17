import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export type OutlinedButtonTone = 'prof' | 'parent' | 'etab' | 'neutre';

const TONE_BACKGROUND: Record<OutlinedButtonTone, string> = {
  prof: 'var(--mk-role-prof)',
  parent: 'var(--mk-role-parent)',
  etab: 'var(--mk-role-etab)',
  neutre: 'var(--mk-role-neutre)'
};

/**
 * Bouton M2 outlined — dans une ligne de liste ou un bloc de contenu.
 * Pas d'état inactif : un bouton de ligne qui ne sert pas n'est pas affiché.
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
      [style.background]="held() ? toneBackground() : 'transparent'"
    >{{ label() }}</button>
  `,
  styleUrl: './outlined-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OutlinedButtonComponent {
  /** Court : il est mis en majuscules et doit tenir sur une ligne. */
  readonly label = input.required<string>();
  /** Teinte du fond au pressé — celle du rôle de l'écran. */
  readonly tone = input<OutlinedButtonTone>('prof');
  /** `true` pour partager la largeur avec ses frères dans un flex. */
  readonly full = input(false);
  readonly clicked = output<void>();

  protected readonly held = signal(false);
  protected readonly toneBackground = computed(() => TONE_BACKGROUND[this.tone()]);
}
