import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, form, submit } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';

import { ParentAlerts } from '@core/auth/auth.model';
import { injectTranslate } from '@core/i18n/translate';
import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { SwitchComponent } from '@core/shared/components/forms/switch/switch';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { AuthFlowStore } from '../auth.store';
import { ALERT_OPTIONS, AlertOption, DEFAULT_ALERTS } from '../model';

/**
 * Alert settings container, offered right after linking and before the first
 * access to the feed (US-PA01, RM-16). The number of SMS triggered is announced
 * before confirming: it is a real cost on the target market.
 */
@Component({
  selector: 'app-alerts-page',
  imports: [AppBarComponent, SwitchComponent, FooterActionComponent, FormField, TranslocoPipe],
  templateUrl: './alerts-page.html',
  styleUrls: ['./auth-page.scss', './alerts-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertsPageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();

  protected readonly options = ALERT_OPTIONS;
  protected readonly scrolled = signal(false);

  private readonly model = signal<ParentAlerts>({ ...DEFAULT_ALERTS });
  protected readonly form = form(this.model);

  protected readonly firstName = computed(() => {
    const name = this.store.invitation()?.student ?? '';
    return name.split(' ').slice(1).join(' ') || this.t('auth.alerts.yourChild');
  });

  protected readonly estimate = computed(() => {
    const settings = this.model();
    const sms = Math.round(ALERT_OPTIONS.reduce((total, a) => total + (settings[a.key] ? a.smsPerMonth : 0), 0));
    return sms === 0 ? this.t('auth.alerts.noSms') : this.t('auth.alerts.smsPerMonth', { count: sms });
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
