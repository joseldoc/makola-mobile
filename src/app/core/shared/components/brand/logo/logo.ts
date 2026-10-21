import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type LogoVariant = 'lockup' | 'mark' | 'icon';
export type LogoTone = 'color' | 'ink' | 'white' | 'mono';

const TONES: Record<LogoTone, [stroke: string, bookmark: string | null, text: string]> = {
  color: ['var(--mk-bleu)', 'var(--mk-ambre)', 'var(--mk-encre)'],
  ink: ['var(--mk-encre)', 'var(--mk-ambre)', 'var(--mk-encre)'],
  white: ['#FFFFFF', 'var(--mk-role-parent)', '#FFFFFF'],
  mono: ['currentColor', null, 'currentColor']
};

/**
 * @makola mark — the "m" book: two open pages draw the two arches of the m, the
 * bookmark falls from the spine. Single stroke at 7.5 % of the height, no gradient.
 * Splash screen, sign-in, document header — never in an app bar.
 * Source: @makola Design System, components/brand/Logo.jsx.
 */
@Component({
  selector: 'app-logo',
  template: `
    <ng-template #mark let-size="size" let-stroke="stroke" let-bookmark="bookmark">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0.25 8.25 100 100" aria-hidden="true" class="mark">
        <path
          d="M13.75 75.75V44a18.25 18.25 0 0 1 36.5 0v31.75M50.25 44a18.25 18.25 0 0 1 36.5 0v31.75M10 75.75h80.5"
          fill="none"
          [attr.stroke]="stroke"
          stroke-width="7.5"
        />
        @if (bookmark) {
          <path d="M45.25 79.5h10v15l-5-4.5-5 4.5z" [attr.fill]="bookmark" />
        }
      </svg>
    </ng-template>

    @switch (variant()) {
      @case ('icon') {
        <div
          class="icon"
          role="img"
          [attr.aria-label]="title()"
          [style.width.px]="size()"
          [style.height.px]="size()"
          [style.border-radius.px]="size() * 0.22"
        >
          <ng-container
            *ngTemplateOutlet="mark; context: { size: size() * 0.7, stroke: '#FFFFFF', bookmark: tone() === 'mono' ? null : 'var(--mk-role-parent)' }"
          />
        </div>
      }
      @case ('mark') {
        <div class="inline" role="img" [attr.aria-label]="title()">
          <ng-container *ngTemplateOutlet="mark; context: { size: size(), stroke: palette()[0], bookmark: palette()[1] }" />
        </div>
      }
      @default {
        <div class="inline lockup" role="img" [attr.aria-label]="title()" [style.gap.px]="size() * 0.22">
          <ng-container *ngTemplateOutlet="mark; context: { size: size(), stroke: palette()[0], bookmark: palette()[1] }" />
          <span aria-hidden="true" class="name" [style.font-size.px]="size() * 0.7" [style.color]="palette()[2]">makola</span>
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .mark {
      display: block;
      flex: none;
    }
    .inline {
      display: inline-flex;
      align-items: center;
    }
    .icon {
      flex: none;
      background: var(--mk-bleu);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .name {
      font-family: var(--mk-font);
      font-weight: 400;
      line-height: 1;
      letter-spacing: -0.02em;
      white-space: nowrap;
    }
  `,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoComponent {
  /** `lockup` (mark + name), `mark` (mark alone), `icon` (app tile). */
  readonly variant = input<LogoVariant>('lockup');
  /** Height of the mark in px. Floor: 24 for the mark, 20 for the lockup. */
  readonly size = input(32);
  /** `color` on white only · `white` on primary blue · `mono` without bookmark. */
  readonly tone = input<LogoTone>('color');
  readonly title = input('@makola');

  protected readonly palette = computed(() => TONES[this.tone()]);
}
