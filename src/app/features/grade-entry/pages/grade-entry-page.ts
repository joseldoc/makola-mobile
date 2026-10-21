import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { decimalSeparator } from '@core/i18n/format';
import { injectTranslate } from '@core/i18n/translate';
import { LanguageStore } from '@core/store/language/language.store';
import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { ListRowComponent, ListRowValueTone } from '@core/shared/components/data/list-row/list-row';
import { NetworkBannerComponent } from '@core/shared/components/data/network-banner/network-banner';
import { KeypadComponent } from '@core/shared/components/forms/keypad/keypad';

import { GradeCell, isCode } from '../model';
import { GradeEntryStore } from '../grade-entry.store';

const PASS_MARK = 10;

/**
 * Grade entry screen container — dedicated keypad, active row, confirmation
 * flash, offline banner.
 * Source: @makola Design System, ui_kits/app/SaisieScreen.jsx.
 */
@Component({
  selector: 'app-grade-entry-page',
  imports: [AppBarComponent, ListRowComponent, NetworkBannerComponent, KeypadComponent, TranslocoPipe],
  templateUrl: './grade-entry-page.html',
  styleUrl: './grade-entry-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GradeEntryPageComponent {
  protected readonly store = inject(GradeEntryStore);
  private readonly language = inject(LanguageStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();

  protected readonly separator = computed(() => decimalSeparator(this.language.language()));

  protected readonly subtitle = computed(() => {
    const s = this.store;
    const progress = this.t('gradeEntry.progress', { count: s.entered(), total: s.names().length });
    return `${s.classroom()} · /${s.scale()} · coef ${s.coefficient()} · ${progress}`;
  });

  /** « 9.5 » → « 9,5 » in French; codes read as words, never as a zero. */
  protected display(cell: GradeCell): string {
    if (!cell) return '—';
    if (isCode(cell)) return this.t(`keypad.${cell}`);
    return cell.replace('.', this.separator());
  }

  protected valueTone(cell: GradeCell): ListRowValueTone {
    if (!cell || isCode(cell)) return 'neutral';
    const n = parseFloat(cell);
    return !Number.isNaN(n) && n < PASS_MARK ? 'danger' : 'neutral';
  }

  protected back(): void {
    void this.router.navigate(['/classroom']);
  }
}
