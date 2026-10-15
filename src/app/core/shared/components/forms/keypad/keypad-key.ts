import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export type KeypadKeyVariant = 'digit' | 'code' | 'action';

/**
 * Generic keypad key. The press (0.93 scale + `--mk-touche-presse` background)
 * is the only tactile feedback of grade entry — it must never be removed.
 * Source: @makola Design System, components/forms/Keypad.jsx (`KeypadKey`).
 */
@Component({
  selector: 'app-keypad-key',
  template: `
    <div
      role="button"
      [class]="'keypad-key ' + variant() + (held() ? ' held' : '')"
      [style.grid-row]="span() ? 'span ' + span() : null"
      [style.transform]="held() ? 'scale(var(--mk-echelle-touche))' : 'none'"
      (pointerdown)="held.set(true)"
      (pointerup)="held.set(false)"
      (pointerleave)="held.set(false)"
      (pointercancel)="held.set(false)"
      (click)="pressed.emit()"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './keypad-key.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeypadKeyComponent {
  readonly variant = input<KeypadKeyVariant>('digit');
  readonly span = input<number>();
  readonly pressed = output<void>();

  protected readonly held = signal(false);
}
