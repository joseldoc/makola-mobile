import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { IconComponent } from '../../foundation/icon/icon';

/**
 * Recherche en pilule sur fond marge. Au focus : fond blanc, contour bleu.
 * Le chargement vit DANS le champ ; le vide propose une autre entrée.
 * Source: @makola Design System, components/forms/SearchField.jsx.
 */
@Component({
  selector: 'app-search-field',
  imports: [IconComponent],
  template: `
    <div class="search-field" [class.focused]="focused()">
      <app-icon name="search-outline" [size]="18" color="var(--mk-text-secondaire)" />
      <input
        [value]="value()"
        [placeholder]="placeholder()"
        (input)="valueChange.emit($any($event.target).value)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
      />
      @if (loading()) {
        <span class="spinner"></span>
      } @else if (value()) {
        <button type="button" class="clear" aria-label="Effacer" (click)="cleared.emit()">
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
  readonly placeholder = input('Rechercher');
  /** Spinner 18 dp dans le champ. Doublez-le d'un bandeau à la place de la liste. */
  readonly loading = input(false);
  readonly cleared = output<void>();

  protected readonly focused = signal(false);
}
