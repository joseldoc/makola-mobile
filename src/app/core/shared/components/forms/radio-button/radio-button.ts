import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Bouton radio M3 — contour 2 dp, pastille intérieure 10 dp.
 * Source: @makola Design System, components/forms/RadioButton.jsx.
 */
@Component({
  selector: 'app-radio-button',
  template: `
    <div class="radio" role="radio" [attr.aria-checked]="selected()" (click)="select.emit()">
      <div class="ring" [class.selected]="selected()">
        @if (selected()) {
          <div class="dot"></div>
        }
      </div>
      <div class="text">
        <div class="label">{{ label() }}</div>
        @if (sublabel()) {
          <div class="sublabel">{{ sublabel() }}</div>
        }
      </div>
    </div>
  `,
  styleUrl: './radio-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioButtonComponent {
  readonly selected = input.required<boolean>();
  readonly select = output<void>();
  readonly label = input.required<string>();
  readonly sublabel = input('');
}
