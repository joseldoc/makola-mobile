import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { formatDate, formatDecimal } from '@core/i18n/format';
import { injectTranslate } from '@core/i18n/translate';
import { LanguageStore } from '@core/store/language/language.store';
import { SessionStore } from '@core/store/session/session.store';
import { AppBarAction, AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { TabItem, TabsComponent } from '@core/shared/components/navigation/tabs/tabs';
import { ListRowComponent } from '@core/shared/components/data/list-row/list-row';
import { NetworkBannerComponent } from '@core/shared/components/data/network-banner/network-banner';
import { SearchFieldComponent } from '@core/shared/components/forms/search-field/search-field';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';
import { ICONS } from '@core/shared/icons';

import { Assignment } from '../model';
import { ClassroomStore } from '../classroom.store';

const ACTION_SEARCH = 0;
const ACTION_LOGOUT = 1;
const VIEW_STUDENTS = 1;

/**
 * Classroom screen container (assignments / students / report card).
 * All logic and store calls live here — the children (AppBar, Tabs, ListRow…)
 * stay presentation components.
 * Source: @makola Design System, ui_kits/app/ClasseScreen.jsx.
 */
@Component({
  selector: 'app-classroom-page',
  imports: [AppBarComponent, TabsComponent, ListRowComponent, NetworkBannerComponent, SearchFieldComponent, FooterActionComponent, TranslocoPipe],
  templateUrl: './classroom-page.html',
  styleUrl: './classroom-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassroomPageComponent {
  protected readonly store = inject(ClassroomStore);
  private readonly language = inject(LanguageStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();

  protected readonly title = computed(() => `${this.store.classroom()} · ${this.store.subject()}`);
  protected readonly subtitle = computed(() => `${this.store.school()} · ${this.t('common.term', { n: this.store.term() })}`);

  protected readonly views = computed<TabItem[]>(() => [
    { id: 0, label: this.t('classroom.tabs.assignments') },
    { id: 1, label: this.t('classroom.tabs.students') },
    { id: 2, label: this.t('classroom.tabs.reportCard') }
  ]);

  protected readonly barActions = computed<AppBarAction[]>(() => [
    { icon: ICONS.search, label: this.t('common.search') },
    { icon: ICONS.logout, label: this.t('common.signOut') }
  ]);

  protected assignmentMeta(a: Assignment): string {
    const language = this.language.language();
    return this.t('classroom.assignmentMeta', { coefficient: a.coefficient, scale: a.scale, date: formatDate(a.date, language) });
  }

  protected decimal(value: number): string {
    return formatDecimal(value, this.language.language());
  }

  protected onViewChange(id: string | number): void {
    this.store.setView(Number(id));
  }

  protected onScroll(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    this.store.setScrolled(target.scrollTop > 0);
  }

  protected onAction(index: number): void {
    if (index === ACTION_SEARCH) this.store.setView(VIEW_STUDENTS);
    else if (index === ACTION_LOGOUT) this.signOut();
  }

  protected enterGrades(): void {
    void this.router.navigate(['/grade-entry']);
  }

  protected newAssignment(): void {
    void this.router.navigate(['/assignment/new']);
  }

  /** Closes the session and goes back to the welcome screen; onboarding is not replayed. */
  private signOut(): void {
    this.session.close();
    void this.router.navigateByUrl('/auth', { replaceUrl: true });
  }
}
