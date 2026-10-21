import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { formatDate } from '@core/i18n/format';
import { injectTranslate } from '@core/i18n/translate';
import { LanguageStore } from '@core/store/language/language.store';
import { TextFieldComponent } from '@core/shared/components/forms/text-field/text-field';
import { MiniFabComponent } from '@core/shared/components/actions/mini-fab/mini-fab';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { Scale } from '../model';
import { AssignmentStore } from '../assignment.store';

const SCALES: Scale[] = [20, 10, 5];

/**
 * New-assignment bottom sheet — per-field validation (RM-13, RM-14), a button
 * that says what is missing instead of a greyed-out "Submit".
 * Source: @makola Design System, ui_kits/app/DevoirSheet.jsx.
 */
@Component({
  selector: 'app-assignment-page',
  imports: [TextFieldComponent, MiniFabComponent, OutlinedButtonComponent, FooterActionComponent, TranslocoPipe],
  templateUrl: './assignment-page.html',
  styleUrl: './assignment-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentPageComponent {
  protected readonly store = inject(AssignmentStore);
  private readonly language = inject(LanguageStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();

  protected readonly scales = SCALES;

  protected readonly titleMessage = computed(() => {
    const m = this.store.titleMessage();
    return m ? this.t(m.key, m.params) : '';
  });

  /** « Today · 19 March 2026 » — the date in the interface language. */
  protected readonly dateLabel = computed(() => {
    const d = this.store.currentDate();
    const date = formatDate(d.date, this.language.language(), 'long');
    return d.today ? this.t('assignment.date.today', { date }) : date;
  });

  /** Dates inside the message are ISO: they are formatted here, in the interface language. */
  protected readonly dateMessage = computed(() => {
    const { key, params = {} } = this.store.currentDate().message;
    const language = this.language.language();
    const formatted = Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? formatDate(v, language) : v])
    );
    return this.t(key, formatted);
  });

  protected close(): void {
    void this.router.navigate(['/classroom']);
  }

  protected create(): void {
    if (this.store.blocked()) return;
    void this.router.navigate(['/grade-entry']);
  }
}
