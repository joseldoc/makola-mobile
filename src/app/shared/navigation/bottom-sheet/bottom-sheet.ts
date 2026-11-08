import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

let nextId = 0;

/**
 * Modal bottom sheet — ink scrim at 42 %, 16 top corners, tappable handle,
 * Escape: the form of the calling-code sheet (`app-country-sheet`), drawn from
 * the new-assignment sheet, made generic on 8 November 2026 for the account
 * sheet. The body is projected and scrolls; the sheet never takes more than 80 %
 * of the screen.
 *
 * One natural event: `closed` (scrim, handle or Escape) — the content emits its
 * own actions. No entry fade, no spring (design system, motion).
 *
 * Source: none of its own in the design system — the sheet of
 * ui_kits/app/DevoirSheet.jsx (voile, poignée, rayon 16), without its form.
 * Not done: focus is not trapped in the sheet, nor given back to the opener.
 */
@Component({
  selector: 'app-bottom-sheet',
  imports: [TranslocoPipe],
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="scrim" (click)="closed.emit()"></div>
    <section
      #dialog
      class="sheet"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      [attr.aria-labelledby]="titleId"
    >
      <button
        type="button"
        class="handle"
        [attr.aria-label]="'common.close' | transloco"
        (click)="closed.emit()"
      >
        <span></span>
      </button>
      <h2 class="title" [id]="titleId">{{ title() }}</h2>
      @if (text()) {
        <p class="text">{{ text() }}</p>
      }
      <div class="body">
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './bottom-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetComponent {
  /** Already translated, or data (an account name). */
  readonly title = input.required<string>();
  /** One line under the title. */
  readonly text = input('');
  readonly closed = output<void>();

  protected readonly titleId = `mk-sheet-title-${++nextId}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');

  constructor() {
    // A screen reader lands in the sheet, not behind its scrim.
    afterNextRender(() => this.dialog().nativeElement.focus({ preventScroll: true }));
  }
}
