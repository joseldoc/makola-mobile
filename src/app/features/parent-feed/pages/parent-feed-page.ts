import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { formatDate, formatDecimal } from '@core/i18n/format';
import { injectTranslate } from '@core/i18n/translate';
import { LanguageStore } from '@core/store/language/language.store';
import { SessionStore } from '@core/store/session/session.store';
import { AppBarAction, AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { ListRowComponent } from '@core/shared/components/data/list-row/list-row';
import { SwitchComponent } from '@core/shared/components/forms/switch/switch';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';
import { ICONS } from '@core/shared/icons';

import { FeedItem } from '../model';
import { ParentFeedStore } from '../parent-feed.store';

const ACTION_SWITCH_CHILD = 0;
const ACTION_LOGOUT = 1;

interface FeedRow {
  title: string;
  meta: string;
  value: string;
  when: string;
  belowPass: boolean;
}

/**
 * Parent feed container — amber role, average boxes, alert switch, twin M2
 * buttons. A separate entry point, another role, another tint.
 * Source: @makola Design System, ui_kits/app/FilParentScreen.jsx.
 */
@Component({
  selector: 'app-parent-feed-page',
  imports: [AppBarComponent, ListRowComponent, SwitchComponent, OutlinedButtonComponent, TranslocoPipe],
  templateUrl: './parent-feed-page.html',
  styleUrl: './parent-feed-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentFeedPageComponent {
  protected readonly store = inject(ParentFeedStore);
  private readonly language = inject(LanguageStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();

  protected readonly barActions = computed<AppBarAction[]>(() => [
    { icon: ICONS.expand, label: this.t('parentFeed.switchChild') },
    { icon: ICONS.logout, label: this.t('common.signOut') }
  ]);

  protected readonly average = computed(() => formatDecimal(this.store.subjectAverage(), this.language.language()));

  /** Feed items as sentences, numbers and dates in the interface language. */
  protected readonly rows = computed<FeedRow[]>(() => {
    const language = this.language.language();
    return this.store.feed().map((item) => ({
      title: this.t(`parentFeed.types.${item.type}`),
      meta: typeof item.meta === 'string' ? item.meta : this.t(item.meta.key, item.meta.params),
      value: this.formatValue(item, language),
      when: item.when.kind === 'date' ? formatDate(item.when.date, language) : this.t(item.when.message.key, item.when.message.params),
      belowPass: item.type === 'gradeBelowPass'
    }));
  });

  protected onScroll(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    this.store.setScrolled(target.scrollTop > 0);
  }

  protected onAction(index: number): void {
    if (index === ACTION_SWITCH_CHILD) this.switchChild();
    else if (index === ACTION_LOGOUT) this.signOut();
  }

  protected switchChild(): void {
    // Will navigate to the child picker once that entry point is built.
  }

  private formatValue(item: FeedItem, language: 'en' | 'fr'): string {
    const v = item.value;
    if (v.kind === 'grade') return formatDecimal(v.value, language);
    if (v.kind === 'date') return formatDate(v.date, language);
    return v.text;
  }

  /** Closes the session and goes back to the welcome screen; onboarding is not replayed. */
  private signOut(): void {
    this.session.close();
    void this.router.navigateByUrl('/auth', { replaceUrl: true });
  }
}
