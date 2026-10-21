import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';

import { registerIcons } from '@core/shared/icons';

registerIcons();

/**
 * Ionicons icon, outline style only — see `ICONS` (@core/shared/icons) for
 * the inventory. Source: @makola Design System, components/foundation/Icon.jsx.
 */
@Component({
  selector: 'app-icon',
  imports: [IonIcon],
  template: `
    <ion-icon
      [name]="name()"
      [attr.role]="label() ? 'img' : 'presentation'"
      [attr.aria-label]="label() ?? null"
      [attr.aria-hidden]="label() ? null : 'true'"
      [style.font-size.px]="size()"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.color]="color()"
      style="flex: none; display: block"
    ></ion-icon>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  /** Full Ionicons name, or a value of `ICONS`. Always an `-outline`. */
  readonly name = input.required<string>();
  /** 22 by default (app bar target). 18 in a field, 16 inline with text. */
  readonly size = input(22);
  readonly color = input('currentColor');
  /** Set only when the icon stands alone and carries meaning; otherwise decorative. Already translated. */
  readonly label = input<string>();
}
