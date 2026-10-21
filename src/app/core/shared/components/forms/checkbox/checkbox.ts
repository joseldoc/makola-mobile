import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent } from '@core/shared/components';

/**
 * M3 checkbox — the 48 dp target is carried by the WHOLE ROW, not the box.
 * Source: @makola Design System, components/forms/Checkbox.jsx.
 */
@Component({
  selector: 'app-checkbox',
  imports: [IconComponent],
  template: `
    <div
      class="checkbox"
      role="checkbox"
      tabindex="0"
      [attr.aria-checked]="checked()"
      (click)="checkedChange.emit(!checked())"
      (keydown.space)="$event.preventDefault(); checkedChange.emit(!checked())"
      (keydown.enter)="$event.preventDefault(); checkedChange.emit(!checked())"
    >
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
