import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { IconComponent } from '../../foundation/icon/icon';

/**
 * Pill search on the margin background. On focus: white background, blue outline.
 * Loading lives INSIDE the field; an empty result suggests another entry.
 * Source: @makola Design System, components/forms/SearchField.jsx.
 */
@Component({
  selector: 'app-search-field',
  imports: [IconComponent, TranslocoPipe],
  template: `
    <div class="search-field" [class.focused]="focused()">
      <app-icon name="search-outline" [size]="18" color="var(--mk-text-secondaire)" />
      <input
        [value]="value()"
        [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()"
        enterkeyhint="search"
        autocomplete="off"
        (input)="valueChange.emit($any($event.target).value)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
      />
      @if (loading()) {
        <span class="spinner"></span>
      } @else if (value()) {
        <button type="button" class="clear" [attr.aria-label]="'common.clear' | transloco" (click)="cleared.emit()">
          <app-icon name="close-outline" [size]="18" />
        </button>
      }
    </div>
  `,
  styleUrl: './search-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchFieldComponent {
  readonly value = input.required<string>();
  readonly valueChange = output<string>();
  /** Already translated. */
  readonly placeholder = input.required<string>();
  /** 18 dp spinner in the field. Pair it with a banner in place of the list. */
  readonly loading = input(false);
  readonly cleared = output<void>();

  protected readonly focused = signal(false);
}
