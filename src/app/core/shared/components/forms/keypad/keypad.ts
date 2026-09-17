import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent } from '../../foundation/icon/icon';
import { KeypadKeyComponent } from './keypad-key';

/**
 * Pavé numérique dédié — le clavier système n'ouvre jamais sur une saisie de
 * note. `columns=4` pour la saisie de notes (colonne de codes « Absent »,
 * « Non noté »), `columns=3` pour un code à chiffres (pas de virgule, pas de codes).
 * Source: @makola Design System, components/forms/Keypad.jsx.
 */
@Component({
  selector: 'app-keypad',
  imports: [KeypadKeyComponent, IconComponent],
  template: `
    <div class="keypad" [style.grid-template-columns]="'repeat(' + columns() + ',1fr)'">
      <app-keypad-key (pressed)="digit.emit('1')">1</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('2')">2</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('3')">3</app-keypad-key>
      @if (columns() === 4) {
        <app-keypad-key variant="code" (pressed)="absent.emit()">Absent</app-keypad-key>
      }
      <app-keypad-key (pressed)="digit.emit('4')">4</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('5')">5</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('6')">6</app-keypad-key>
      @if (columns() === 4) {
        <app-keypad-key variant="code" (pressed)="ungraded.emit()">Non noté</app-keypad-key>
      }
      <app-keypad-key (pressed)="digit.emit('7')">7</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('8')">8</app-keypad-key>
      <app-keypad-key (pressed)="digit.emit('9')">9</app-keypad-key>
      @if (columns() === 4) {
        <app-keypad-key variant="action" [span]="2" (pressed)="next.emit()">{{ nextLabel() }}</app-keypad-key>
      }
      @if (columns() === 4) {
        <app-keypad-key (pressed)="comma.emit()">,</app-keypad-key>
      } @else {
        <div></div>
      }
      <app-keypad-key (pressed)="digit.emit('0')">0</app-keypad-key>
      <app-keypad-key variant="code" (pressed)="backspace.emit()">
        <app-icon name="backspace-outline" [size]="22" />
      </app-keypad-key>
    </div>
  `,
  styleUrl: './keypad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeypadComponent {
  /** 4 pour la saisie de notes (colonne de codes), 3 pour un code à chiffres. */
  readonly columns = input<3 | 4>(4);
  readonly digit = output<string>();
  readonly comma = output<void>();
  readonly backspace = output<void>();
  /** colonnes=4 seulement — « absent » n'est pas un zéro. */
  readonly absent = output<void>();
  /** colonnes=4 seulement — « non noté » n'est pas un zéro. */
  readonly ungraded = output<void>();
  readonly next = output<void>();
  readonly nextLabel = input('Suivant');
}
