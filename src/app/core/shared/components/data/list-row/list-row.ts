import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type ListRowValueTone = 'neutral' | 'danger' | 'success' | 'pending';

const VALUE_COLOR: Record<ListRowValueTone, string> = {
  neutral: 'var(--mk-text)',
  danger: 'var(--mk-refus)',
  success: 'var(--mk-succes)',
  pending: 'var(--mk-attente)'
};

/**
 * The list row — the product's content unit. 56 dp minimum, white / off-white
 * alternation, blue left border when active, 420 ms green flash on confirmation.
 * Source: @makola Design System, components/data/ListRow.jsx.
 */
@Component({
  selector: 'app-list-row',
  template: `
    <div
      class="list-row"
      [class.alt]="!active() && !flash() && index() % 2 === 1"
      [class.active]="active()"
      [class.flash]="flash()"
      (click)="rowClick.emit()"
    >
      <ng-content select="[leading]" />
      <div class="texts">
        <div class="primary">{{ primary() }}</div>
        @if (secondary()) {
          <div class="secondary">{{ secondary() }}</div>
        }
        @if (tertiary()) {
          <div class="tertiary">{{ tertiary() }}</div>
        }
      </div>
      @if (hasValue()) {
        <div class="value" [class.large]="isLarge()" [style.color]="valueColor()">{{ value() }}</div>
      }
      <ng-content select="[trailing]" />
    </div>
  `,
  styleUrl: './list-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListRowComponent {
  /** Student name, assignment title — weight 500. */
  readonly primary = input.required<string>();
  readonly secondary = input('');
  readonly tertiary = input('');
  /** Grade, average, date — already formatted. Short (≤ 5 chars): shown in tabular 30 sp. */
  readonly value = input<string | number>();
  /** `danger` below the pass mark, `success` confirmed, `pending` in progress. */
  readonly valueTone = input<ListRowValueTone>('neutral');
  /** Position in the list — drives the background alternation. Always pass it. */
  readonly index = input(0);
  /** Current student in grade entry: blue left border + #F5F8FF background. */
  readonly active = input(false);
  /** Confirmation: pale green background for 420 ms. */
  readonly flash = input(false);
  readonly rowClick = output<void>();

  protected readonly hasValue = computed(() => this.value() !== undefined && this.value() !== null && this.value() !== '');
  protected readonly isLarge = computed(() => {
    const v = this.value();
    return v === undefined || v === null || String(v).length <= 5;
  });
  protected readonly valueColor = computed(() => VALUE_COLOR[this.valueTone()]);
}
