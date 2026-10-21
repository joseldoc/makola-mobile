import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { IconComponent } from '../../foundation/icon/icon';
import { KeypadKeyComponent } from './keypad-key';

/**
 * Dedicated keypad — the system keyboard never opens on a grade entry.
 * `columns=4` for grade entry (a code column: "Absent", "Not graded"),
 * `columns=3` for a digit code (no decimal key, no codes).
 * Source: @makola Design System, components/forms/Keypad.jsx.
 */
@Component({
  selector: 'app-keypad',
  imports: [KeypadKeyComponent, IconComponent, TranslocoPipe],
  template: `
    <div class="keypad" [style.grid-template-columns]="'repeat(' + columns() + ',1fr)'">
      <app-keypad-key (pressed)="digit.emit('1')">1</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('2')">2</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('3')">3</app-keypad-key>
      @if (columns() === 4) {
        <app-keypad-key variant="code" (pressed)="absent.emit()">{{ 'keypad.absent' | transloco }}</app-keypad-key>
      }
      <app-keypad-key (pressed)="digit.emit('4')">4</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('5')">5</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('6')">6</app-keypad-key>
      @if (columns() === 4) {
        <app-keypad-key variant="code" (pressed)="ungraded.emit()">{{ 'keypad.ungraded' | transloco }}</app-keypad-key>
      }
      <app-keypad-key (pressed)="digit.emit('7')">7</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('8')">8</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('9')">9</app-keypad-key>
      @if (columns() === 4) {
        <app-keypad-key variant="action" [span]="2" (pressed)="next.emit()">{{ nextLabel() }}</app-keypad-key>
      }
      @if (columns() === 4) {
        <app-keypad-key (pressed)="decimal.emit()">{{ decimalSeparator() }}</app-keypad-key>
      } @else {
        <div></div>
      }
      <app-keypad-key (pressed)="digit.emit('0')">0</app-keypad-key>
      <app-keypad-key variant="code" (pressed)="backspace.emit()">
        <app-icon name="backspace-outline" [size]="22" [label]="'keypad.backspace' | transloco" />
      </app-keypad-key>
    </div>
  `,
  styleUrl: './keypad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeypadComponent {
  /** 4 for grade entry (code column), 3 for a digit code. */
  readonly columns = input<3 | 4>(4);
  /** « . » in English, « , » in French — follows the interface language. */
  readonly decimalSeparator = input('.');
  readonly digit = output<string>();
  readonly decimal = output<void>();
  readonly backspace = output<void>();
  /** columns=4 only — "absent" is not a zero. */
  readonly absent = output<void>();
  /** columns=4 only — "not graded" is not a zero. */
  readonly ungraded = output<void>();
  readonly next = output<void>();
  /** Label of the action key — already translated. */
  readonly nextLabel = input('');
}
