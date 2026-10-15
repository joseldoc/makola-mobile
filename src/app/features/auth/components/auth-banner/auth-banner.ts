import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LogoComponent } from '@core/shared/components/brand/logo/logo';
import { BarTargetComponent } from '@core/shared/components/navigation/app-bar/bar-target';
import { ROLE_TINTS } from '@core/shared/roles';

export type AuthBannerRole = 'school' | 'parent';

/**
 * Entry banner (@makola mock-up, turn 24c): the tonal surface carries the mark,
 * the step, the title and the instruction; the field and the keypad stay on
 * white — "colour welcomes, it never gets in the way of typing".
 * Diluted blue while we don't know who is signing in; amber on the parent flow.
 * On a tonal surface only ink carries text (contrast audit, 30a).
 */
@Component({
  selector: 'app-auth-banner',
  imports: [LogoComponent, BarTargetComponent, TranslocoPipe],
  template: `
    <header class="banner" [style.background]="tint()[0]">
      <div class="shape shape-top" [style.background]="tint()[1]"></div>
      <div class="shape shape-bottom" [style.background]="tint()[1]"></div>

      <div class="content">
        <div class="head">
          @if (showBack()) {
            <app-bar-target icon="chevron-back-outline" [label]="'common.back' | transloco" [tone]="tint()[1]" (clicked)="back.emit()" />
          }
          <div class="brand">
            <app-logo variant="icon" [size]="40" />
            <span class="name" aria-hidden="true">makola</span>
          </div>
        </div>
        @if (step()) {
          <p class="step">{{ step() }}</p>
        }
        <h1 class="title">{{ title() }}</h1>
        <p class="text">{{ text() }}</p>
      </div>
    </header>
  `,
  styleUrl: './auth-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthBannerComponent {
  /** Already translated. */
  readonly title = input.required<string>();
  readonly text = input('');
  /** "Step 1 of 3" — only on a multi-screen flow. */
  readonly step = input('');
  readonly role = input<AuthBannerRole>('school');
  readonly showBack = input(true);
  readonly back = output<void>();

  protected readonly tint = computed(() => ROLE_TINTS[this.role()]);
}
