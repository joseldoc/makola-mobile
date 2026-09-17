import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';

import { registerIcons } from '@core/shared/icons';

registerIcons();

/**
 * Icône Ionicons, style outline uniquement — voir `ICONS` (@core/shared/icons)
 * pour l'inventaire. Source: @makola Design System, components/foundation/Icon.jsx.
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
  /** Nom Ionicons complet, ou une valeur de `ICONS`. Toujours un `-outline`. */
  readonly name = input.required<string>();
  /** 22 par défaut (cible de barre d'app). 18 dans un champ, 16 en ligne de texte. */
  readonly size = input(22);
  readonly color = input('currentColor');
  /** Renseigner seulement si l'icône est seule et porteuse de sens ; sinon décorative. */
  readonly label = input<string>();
}
