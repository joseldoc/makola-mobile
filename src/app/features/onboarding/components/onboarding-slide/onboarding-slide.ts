import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TonalHeaderComponent } from '@core/shared/components/data/tonal-header/tonal-header';
import { IconComponent } from '@core/shared/components/foundation/icon/icon';

import { OnboardingSlide } from '../../modele';

/**
 * Un écran de présentation : bandeau tonal plein cadre à la teinte du rôle
 * concerné, une icône du jeu dans un disque blanc, un titre, un texte.
 * Aucune illustration — la règle @makola vaut aussi pour l'entrée.
 */
@Component({
  selector: 'app-onboarding-slide',
  imports: [TonalHeaderComponent, IconComponent],
  template: `
    <article class="slide" role="group" aria-roledescription="écran" [attr.aria-label]="position()">
      <app-tonal-header [role]="slide().role" [pleinCadre]="true">
        <div class="visuel">
          <div class="disque">
            <app-icon [name]="slide().icon" [size]="36" />
          </div>
        </div>
      </app-tonal-header>
      <div class="corps">
        <p class="rubrique">{{ slide().rubrique }}</p>
        <h2 class="titre">{{ slide().titre }}</h2>
        <p class="texte">{{ slide().texte }}</p>
      </div>
    </article>
  `,
  styleUrl: './onboarding-slide.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingSlideComponent {
  readonly slide = input.required<OnboardingSlide>();
  /** « 2 sur 4 » — annoncé par les lecteurs d'écran. */
  readonly position = input('');
}
