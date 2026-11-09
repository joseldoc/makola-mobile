import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { formatDate, formatDecimal } from '@core/i18n/format';
import { Language } from '@core/i18n/language';
import { injectTranslate } from '@core/i18n/translate';
import { Role } from '@core/models/auth.model';
import { isBelowPassMark, passMark } from '@core/models/grading';
import { periodKey } from '@core/models/period';
import { LanguageStore } from '@core/store/language/language.store';
import { ThemeStore } from '@core/store/theme/theme.store';
import { SessionStore } from '@core/store/session/session.store';
import { AccountButtonComponent } from '@shared/account/account-button/account-button';
import {
  AccountSheetComponent,
  AccountSheetEvent,
} from '@shared/account/account-sheet/account-sheet';
import { AccountSheetActions } from '@shared/account/enums/account-sheet-actions.enum';
import { AppBarAction, AppBarComponent } from '@shared/navigation/app-bar/app-bar';
import { ListRowComponent } from '@shared/data/list-row/list-row';
import { SwitchComponent } from '@shared/forms/switch/switch';
import { OutlinedButtonComponent } from '@shared/actions/outlined-button/outlined-button';
import { ICONS } from '@shared/icons';

import { ParentFeedBarActions } from '../../enums/parent-feed-bar-actions.enum';
import { FeedItem } from '../../models/parent-feed.model';
import { ParentFeedStore } from '../../state/parent-feed.store';

/** An app-bar action and what it asks for: `app-bar` emits its index in the list. */
interface ParentFeedBarAction extends AppBarAction {
  action: ParentFeedBarActions;
}

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
  imports: [
    AppBarComponent,
    AccountButtonComponent,
    AccountSheetComponent,
    ListRowComponent,
    SwitchComponent,
    OutlinedButtonComponent,
    TranslocoPipe,
  ],
  templateUrl: './parent-feed-page.html',
  styleUrl: './parent-feed-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentFeedPageComponent {
  protected readonly store = inject(ParentFeedStore);
  protected readonly language = inject(LanguageStore);
  protected readonly theme = inject(ThemeStore);
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();

  /**
   * The actions of the feature only: the account's (other space, invitation,
   * language, sign out) are in the account sheet, opened by the account button.
   */
  protected readonly barActions = computed<ParentFeedBarAction[]>(() => [
    {
      action: ParentFeedBarActions.SwitchChild,
      icon: ICONS.expand,
      label: this.t('parentFeed.switchChild'),
    },
  ]);

  /** The account sheet is open. */
  protected readonly accountOpen = signal(false);

  protected readonly average = computed(() =>
    formatDecimal(this.store.subjectAverage(), this.language.language()),
  );

  /**
   * Class average in the subject, beside the child's — `null` without a value
   * (neither zero nor dash). Never compared: same ink whatever the two numbers.
   */
  protected readonly classAverage = computed(() => {
    const value = this.store.classSubjectAverage();
    return value === undefined ? null : formatDecimal(value, this.language.language());
  });

  /** « Term 2 » or « Semester 2 »: the period of the child's class (RM-02). */
  protected readonly periodLabel = computed(() => {
    const { kind, n } = this.store.period();
    return this.t(periodKey('period', kind), { n });
  });

  /**
   * The period card states when the period closes — no trend, no arrow, no colour:
   * a colour never rewards a student (design system).
   */
  protected readonly periodCloses = computed(() =>
    this.t('parentFeed.periodCloses', {
      date: formatDate(this.store.periodCloses(), this.language.language()),
    }),
  );

  /** Feed items as sentences, numbers and dates in the interface language. */
  protected readonly rows = computed<FeedRow[]>(() => {
    const language = this.language.language();
    return this.store.feed().map((item) => ({
      title: this.formatTitle(item, language),
      meta: this.formatMeta(item, language),
      value: this.formatValue(item, language),
      when:
        item.when.kind === 'date'
          ? formatDate(item.when.date, language)
          : this.t(item.when.message.key, item.when.message.params),
      // The pass mark of the grade's own scale, never the class average (RM-11).
      belowPass: item.value.kind === 'grade' && isBelowPassMark(item.value.value, item.value.scale),
    }));
  });

  protected onScroll(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    this.store.setScrolled(target.scrollTop > 0);
  }

  protected onAction(index: number): void {
    const selected = this.barActions()[index];
    if (!selected) return;
    switch (selected.action) {
      case ParentFeedBarActions.SwitchChild:
        this.switchChild();
        return;
    }
  }

  /** The account sheet's single event: this page decides what each action does. */
  protected onAccountSheet(event: AccountSheetEvent): void {
    switch (event.action) {
      case AccountSheetActions.SwitchSpace:
        this.accountOpen.set(false);
        this.switchSpace(event.role);
        return;
      case AccountSheetActions.JoinInvitation:
        this.accountOpen.set(false);
        // A-23: another child or another teacher's subject, without signing out.
        void this.router.navigateByUrl('/auth/join');
        return;
      case AccountSheetActions.ChangeLanguage:
        void this.language.setLanguage(event.language);
        return;
      case AccountSheetActions.ChangeAppearance:
        this.theme.setAppearance(event.appearance);
        return;
      case AccountSheetActions.SignOut:
        this.signOut();
        return;
      case AccountSheetActions.Close:
        this.accountOpen.set(false);
        return;
    }
  }

  /** The child's page, in the one subject of the teacher who invited this parent (A-19). */
  protected openGrades(): void {
    void this.router.navigateByUrl('/student/child');
  }

  protected switchChild(): void {
    // Will navigate to the child picker once that entry point is built.
  }

  /** « Grade below 10 » on /20, « Grade below 5 » on /10: the pass mark of its scale. */
  private formatTitle(item: FeedItem, language: Language): string {
    const v = item.value;
    const mark = v.kind === 'grade' ? formatDecimal(passMark(v.scale), language) : '';
    return this.t(`parentFeed.types.${item.type}`, { mark });
  }

  /**
   * Assignment meta, followed by the class average when the server sent one —
   * on the secondary line, the one that holds 4.5:1 in light mode (the tertiary
   * line does not). The child's grade stays the row's value; nothing compares them.
   */
  private formatMeta(item: FeedItem, language: Language): string {
    const meta =
      typeof item.meta === 'string' ? item.meta : this.t(item.meta.key, item.meta.params);
    const v = item.value;
    if (v.kind !== 'grade' || v.classAverage === undefined) return meta;
    return `${meta} · ${this.t('parentFeed.classAverage', { value: formatDecimal(v.classAverage, language) })}`;
  }

  private formatValue(item: FeedItem, language: Language): string {
    const v = item.value;
    if (v.kind === 'grade') return formatDecimal(v.value, language);
    if (v.kind === 'date') return formatDate(v.date, language);
    return v.text;
  }

  /**
   * The other space becomes the active one — reopened at the next launch — and
   * opens on its step 2 if it is not done yet. The two spaces are peers: the
   * history does not go back from one to the other.
   */
  private switchSpace(role: Role): void {
    this.session.switchSpace(role);
    void this.router.navigateByUrl(this.session.initialRoute(), { replaceUrl: true });
  }

  /** Closes the session and goes back to the welcome screen; onboarding is not replayed. */
  private signOut(): void {
    this.session.close();
    void this.router.navigateByUrl('/auth', { replaceUrl: true });
  }
}
