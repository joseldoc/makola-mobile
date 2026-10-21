import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

export type ProgressDotsTone = 'primary' | 'pending' | 'success';

const TONE_COLOR: Record<ProgressDotsTone, string> = {
  primary: 'var(--mk-primaire)',
  pending: 'var(--mk-attente)',
  success: 'var(--mk-succes)'
};

/**
 * Progress dots — the active one stretches to 26 dp, past ones fade.
 * Tappable both ways: the user can go back.
 * Source: @makola Design System, components/navigation/ProgressDots.jsx.
 */
@Component({
  selector: 'app-progress-dots',
  imports: [TranslocoPipe],
  template: `
    <div class="progress-dots" role="tablist" [attr.aria-label]="label()">
      @for (i of indices(); track i) {
        <button
          type="button"
          class="dot"
          role="tab"
          [attr.aria-selected]="i === index()"
          [attr.aria-label]="'progressDots.position' | transloco: { current: i + 1, total: count() }"
          [style.width.px]="i === index() ? 26 : 6"
          [style.background]="dotColor(i)"
          (click)="indexChange.emit(i)"
        ></button>
      }
    </div>
  `,
  styleUrl: './progress-dots.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressDotsComponent {
  readonly count = input.required<number>();
  readonly index = input.required<number>();
  /** Tappable both ways: the user can go back. */
  readonly indexChange = output<number>();
  readonly tone = input<ProgressDotsTone>('primary');
  /** Group name for screen readers — already translated. */
  readonly label = input('');

  protected readonly indices = computed(() => Array.from({ length: this.count() }, (_, i) => i));
  protected readonly color = computed(() => TONE_COLOR[this.tone()]);

  protected dotColor(i: number): string {
    const current = this.index();
    if (i === current) return this.color();
    if (i < current) return `color-mix(in srgb, ${this.color()} 34%, transparent)`;
    return 'rgba(16,26,46,.18)';
  }
}
