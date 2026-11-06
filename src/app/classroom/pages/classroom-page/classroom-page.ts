import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { formatDate, formatDecimal } from '@core/i18n/format';
import { injectTranslate } from '@core/i18n/translate';
import { Role } from '@core/models/auth.model';
import { LanguageStore } from '@core/store/language/language.store';
import { SessionStore } from '@core/store/session/session.store';
import { AppBarAction, AppBarComponent } from '@shared/navigation/app-bar/app-bar';
import { TabItem, TabsComponent } from '@shared/navigation/tabs/tabs';
import { ListRowComponent } from '@shared/data/list-row/list-row';
import { NetworkBannerComponent } from '@shared/data/network-banner/network-banner';
import { SearchFieldComponent } from '@shared/forms/search-field/search-field';
import { FooterActionComponent } from '@shared/actions/footer-action/footer-action';
import { ICONS } from '@shared/icons';

import { ClassroomBarActions } from '../../enums/classroom-bar-actions.enum';
import { Assignment } from '../../models/classroom.model';
import { ClassroomStore } from '../../state/classroom.store';

const VIEW_STUDENTS = 1;

/** An app-bar action and what it asks for: `app-bar` emits its index in the list. */
interface ClassroomBarAction extends AppBarAction {
  action: ClassroomBarActions;
}

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

  /** The parent space appears only when the account also holds that role (ID-02). */
  protected readonly barActions = computed<ClassroomBarAction[]>(() => [
    { action: ClassroomBarActions.Search, icon: ICONS.search, label: this.t('common.search') },
    ...(this.session.hasRole('parent')
      ? [{ action: ClassroomBarActions.ParentSpace, icon: ICONS.student, label: this.t('spaces.parent') }]
      : []),
    { action: ClassroomBarActions.SignOut, icon: ICONS.logout, label: this.t('common.signOut') }
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

  /** The index is read in the list shown, which changes with the account's roles. */
  protected onAction(index: number): void {
    const selected = this.barActions()[index];
    if (!selected) return;
    switch (selected.action) {
      case ClassroomBarActions.Search:
        this.store.setView(VIEW_STUDENTS);
        return;
      case ClassroomBarActions.ParentSpace:
        this.switchSpace('parent');
        return;
      case ClassroomBarActions.SignOut:
        this.signOut();
        return;
    }
  }

  protected enterGrades(): void {
    void this.router.navigate(['/grade-entry']);
  }

  protected newAssignment(): void {
    void this.router.navigate(['/assignment/new']);
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
