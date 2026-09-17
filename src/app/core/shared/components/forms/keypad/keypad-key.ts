import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export type KeypadKeyVariant = 'chiffre' | 'code' | 'action';

/**
 * Touche générique du pavé numérique. L'enfoncement (0,93 + fond
 * `--mk-touche-presse`) est le seul retour tactile de la saisie.
 * Source: @makola Design System, components/forms/Keypad.jsx (`KeypadKey`).
 */
@Component({
  selector: 'app-keypad-key',
  template: `
    <div
      [class]="'keypad-key ' + variant() + (held() ? ' held' : '')"
      [style.grid-row]="span() ? 'span ' + span() : null"
      [style.transform]="held() ? 'scale(var(--mk-echelle-touche))' : 'none'"
      (pointerdown)="held.set(true)"
      (pointerup)="held.set(false)"
      (pointerleave)="held.set(false)"
      (click)="pressed.emit()"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './keypad-key.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeypadKeyComponent {
  readonly variant = input<KeypadKeyVariant>('chiffre');
  readonly span = input<number>();
  readonly pressed = output<void>();

  protected readonly held = signal(false);
}
