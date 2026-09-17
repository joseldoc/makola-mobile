import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent } from '@core/shared/components';

/**
 * Case M3 — la cible de 48 dp est portée par la LIGNE entière, pas par la case.
 * Source: @makola Design System, components/forms/Checkbox.jsx.
 */
@Component({
  selector: 'app-checkbox',
  imports: [IconComponent],
  template: `
    <div class="checkbox" role="checkbox" [attr.aria-checked]="checked()" (click)="checkedChange.emit(!checked())">
      <div class="box" [class.checked]="checked()">
        @if (checked()) {
          <app-icon name="checkmark-outline" [size]="12" color="var(--mk-text-sur-primaire)" />
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
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent {
  readonly checked = input.required<boolean>();
  readonly checkedChange = output<boolean>();
  readonly label = input.required<string>();
  readonly sublabel = input('');
}
