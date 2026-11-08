import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, form, submit } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';

import { ParentAlerts } from '@core/models/auth.model';
import { passMark, Scale } from '@core/models/grading';
import { formatDecimal } from '@core/i18n/format';
import { injectTranslate } from '@core/i18n/translate';
import { LanguageStore } from '@core/store/language/language.store';
import { AppBarComponent } from '@shared/navigation/app-bar/app-bar';
import { SwitchComponent } from '@shared/forms/switch/switch';
import { FooterActionComponent } from '@shared/actions/footer-action/footer-action';

import { AuthFlowStore } from '../../state/auth.store';
import { ALERT_OPTIONS, AlertOption, DEFAULT_ALERTS } from '../../models/auth.model';

/**
 * Alert settings container, offered right after linking and before the first
 * access to the feed (US-PA01, RM-16). The number of SMS triggered is announced
 * before confirming: it is a real cost on the target market.
 */
@Component({
  selector: 'app-alerts-page',
  imports: [AppBarComponent, SwitchComponent, FooterActionComponent, FormField, TranslocoPipe],
  templateUrl: './alerts-page.html',
  styleUrls: ['../auth-page.scss', './alerts-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsPageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageStore);
  private readonly t = injectTranslate();

  protected readonly options = ALERT_OPTIONS;
  protected readonly scrolled = signal(false);

  private readonly model = signal<ParentAlerts>({ ...DEFAULT_ALERTS });
  protected readonly form = form(this.model);

  protected readonly firstName = computed(() => {
    const name = this.store.invitation()?.student ?? '';
    return name.split(' ').slice(1).join(' ') || this.t('auth.alerts.yourChild');
  });

  /**
   * The pass mark of each scale, for the « below the pass mark » alert: read in
   * `passMark`, never written in the text — 2.5 in English, 2,5 in French.
   */
  protected readonly detailParams = computed(() => {
    const language = this.language.language();
    const mark = (scale: Scale) => formatDecimal(passMark(scale), language);
    return { mark20: mark(20), mark10: mark(10), mark5: mark(5) };
  });

  protected readonly estimate = computed(() => {
    const settings = this.model();
    const sms = Math.round(
      ALERT_OPTIONS.reduce((total, a) => total + (settings[a.key] ? a.smsPerMonth : 0), 0),
    );
    return sms === 0
      ? this.t('auth.alerts.noSms')
      : this.t('auth.alerts.smsPerMonth', { count: sms });
  });

  protected toggle(option: AlertOption): void {
    this.form[option.key]().value.update((v) => !v);
  }

  protected onScroll(event: Event): void {
    this.scrolled.set((event.currentTarget as HTMLElement).scrollTop > 0);
  }

  protected save(): void {
    void submit(this.form, async () => {
      if (await this.store.saveAlerts(this.model())) {
        void this.router.navigateByUrl('/parent-feed', { replaceUrl: true });
      }
      return undefined;
    });
  }
}
