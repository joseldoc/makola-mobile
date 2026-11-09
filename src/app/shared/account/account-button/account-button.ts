import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { initialsOf } from '@core/models/session';

import { IconComponent } from '../../foundation/icon/icon';
import { ICONS } from '../../icons';
import { ROLE_TINTS, SurfaceRole } from '../../roles';

/**
 * The account button, at the end of the app bar of each space's home: the
 * account's initials in a 32 dp ring, in a round 48 dp target that takes the
 * role's shape tint when pressed (as `app-bar-target`). It opens the account
 * sheet. Without a name yet, a person icon.
 *
 * Its form keeps it apart from the child's avatar of the parent feed: the child
 * is a 40 dp disc at the start of the bar, never a target; the account, a ring
 * at the end, always one.
 *
 * Source: none in the design system (8 November 2026); the ring sits on the
 * surface colour, never on the role tint — text never sits on a tint.
 */
@Component({
  selector: 'app-account-button',
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="target"
      [attr.aria-label]="label()"
      (click)="pressed.emit()"
      (pointerdown)="held.set(true)"
      (pointerup)="held.set(false)"
      (pointerleave)="held.set(false)"
      (pointercancel)="held.set(false)"
      [style.background]="held() ? tone() : 'transparent'"
    >
      <span class="ring" aria-hidden="true">
        @if (initials()) {
          {{ initials() }}
        } @else {
          <app-icon [name]="person" [size]="18" />
        }
      </span>
    </button>
  `,
  styleUrl: './account-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountButtonComponent {
  /** The account's name — its initials are shown. */
  readonly name = input<string>();
  /** The role of the screen: the pressed tint. */
  readonly role = input<SurfaceRole>('teacher');
  /** Already translated — read by screen readers. */
  readonly label = input.required<string>();
  readonly pressed = output<void>();

  protected readonly held = signal(false);
  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly tone = computed(() => ROLE_TINTS[this.role()][1]);
  protected readonly person = ICONS.student;
}
