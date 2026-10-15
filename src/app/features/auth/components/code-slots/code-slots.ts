import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

export type CodeSlotsState = 'idle' | 'checking' | 'error';

/**
 * The boxes of a digit code — typed on the dedicated keypad, never on the system
 * keyboard (Keypad, columns=3). Digits in tabular 30 sp; the next box carries the
 * blue outline, a refusal turns the whole code red.
 */
@Component({
  selector: 'app-code-slots',
  imports: [TranslocoPipe],
  template: `
    <div class="slots" [class.error]="state() === 'error'" [class.checking]="state() === 'checking'" aria-hidden="true">
      @for (i of boxes(); track i) {
        <div class="slot" [class.filled]="i < value().length" [class.next]="i === value().length && state() === 'idle'">
          {{ value()[i] ?? '' }}
        </div>
      }
    </div>
    <span class="sr" aria-live="polite">
      @if (state() === 'checking') {
        {{ 'auth.code.checking' | transloco }}
      } @else {
        {{ 'auth.code.progress' | transloco: { count: value().length, total: length() } }}
      }
    </span>
  `,
  styleUrl: './code-slots.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeSlotsComponent {
  readonly value = input.required<string>();
  readonly length = input(6);
  readonly state = input<CodeSlotsState>('idle');

  protected readonly boxes = computed(() => Array.from({ length: this.length() }, (_, i) => i));
}
