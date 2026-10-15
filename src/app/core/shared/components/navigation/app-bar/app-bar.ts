import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { ROLE_TINTS, SurfaceRole } from '../../../roles';
import { BarTargetComponent } from './bar-target';

export interface AppBarAction {
  icon: string;
  /** Already translated — read by screen readers. */
  label: string;
}

/**
 * M3 app bar, 64 dp, on the role tint. `scrolled` is required as soon as the
 * content scrolls: without it the bar blends into the list.
 * Source: @makola Design System, components/navigation/AppBar.jsx.
 */
@Component({
  selector: 'app-bar',
  imports: [BarTargetComponent, TranslocoPipe],
  template: `
    <div
      class="app-bar"
      [class.tight]="showBack() || hasLeading()"
      [class.scrolled]="scrolled()"
      [style.background]="tint()[0]"
      [style.gap]="showBack() ? 'var(--mk-esp-1)' : 'var(--mk-esp-3)'"
    >
      @if (showBack()) {
        <app-bar-target icon="chevron-back-outline" [tone]="tint()[1]" [label]="'common.back' | transloco" (clicked)="back.emit()" />
      }
      <ng-content select="[leading]" />
      <div class="titles">
        <div class="title">{{ title() }}</div>
        @if (subtitle()) {
          <div class="subtitle">{{ subtitle() }}</div>
        }
      </div>
      @for (action of actions(); track $index) {
        <app-bar-target [icon]="action.icon" [tone]="tint()[1]" [label]="action.label" (clicked)="actionSelected.emit($index)" />
      }
    </div>
  `,
  styleUrl: './app-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBarComponent {
  /** 22 sp, weight 400 — never bold. */
  readonly title = input.required<string>();
  /** School, class, period. Always under the title. */
  readonly subtitle = input('');
  /** Sets the tint. The role of the screen, not a graphic choice. */
  readonly role = input<SurfaceRole>('teacher');
  readonly showBack = input(false);
  readonly back = output<void>();
  readonly actions = input<AppBarAction[]>([]);
  readonly actionSelected = output<number>();
  /** `true` once the content has scrolled: adds the M3 fill. */
  readonly scrolled = input(false);
  /** Set to `true` when content is projected into the `[leading]` slot (avatar, initials). */
  readonly hasLeading = input(false);

  protected readonly tint = computed(() => ROLE_TINTS[this.role()]);
}
