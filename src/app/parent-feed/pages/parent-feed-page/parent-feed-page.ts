import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { formatDate, formatDecimal } from '@core/i18n/format';
import { Language } from '@core/i18n/language';
import { injectTranslate } from '@core/i18n/translate';
import { Role } from '@core/models/auth.model';
import { LanguageStore } from '@core/store/language/language.store';
import { SessionStore } from '@core/store/session/session.store';
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

  /** The teacher space appears only when the account also holds that role (ID-02). */
  protected readonly barActions = computed<ParentFeedBarAction[]>(() => [
    { action: ParentFeedBarActions.SwitchChild, icon: ICONS.expand, label: this.t('parentFeed.switchChild') },
    ...(this.session.hasRole('teacher')
      ? [{ action: ParentFeedBarActions.TeacherSpace, icon: ICONS.classroom, label: this.t('spaces.teacher') }]
      : []),
    { action: ParentFeedBarActions.SignOut, icon: ICONS.logout, label: this.t('common.signOut') }
  ]);

  protected readonly average = computed(() => formatDecimal(this.store.subjectAverage(), this.language.language()));

  /** Feed items as sentences, numbers and dates in the interface language. */
  protected readonly rows = computed<FeedRow[]>(() => {
    const language = this.language.language();
    return this.store.feed().map((item) => ({
      title: this.t(`parentFeed.types.${item.type}`),
      meta: this.formatMeta(item, language),
      value: this.formatValue(item, language),
      when: item.when.kind === 'date' ? formatDate(item.when.date, language) : this.t(item.when.message.key, item.when.message.params),
      belowPass: item.type === 'gradeBelowPass'
    }));
  });

  protected onScroll(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    this.store.setScrolled(target.scrollTop > 0);
  }

  /** The index is read in the list shown, which changes with the account's roles. */
  protected onAction(index: number): void {
    const selected = this.barActions()[index];
    if (!selected) return;
    switch (selected.action) {
      case ParentFeedBarActions.SwitchChild:
        this.switchChild();
        return;
      case ParentFeedBarActions.TeacherSpace:
        this.switchSpace('teacher');
        return;
      case ParentFeedBarActions.SignOut:
        this.signOut();
        return;
    }
  }

  protected switchChild(): void {
    // Will navigate to the child picker once that entry point is built.
  }

  /**
   * Assignment meta, followed by the class average when the server sent one —
   * on the secondary line, the one that holds 4.5:1 in light mode (the tertiary
   * line does not). The child's grade stays the row's value; nothing compares them.
   */
  private formatMeta(item: FeedItem, language: Language): string {
    const meta = typeof item.meta === 'string' ? item.meta : this.t(item.meta.key, item.meta.params);
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
