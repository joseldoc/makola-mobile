import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { formatDate, formatDecimal } from '@core/i18n/format';
import { injectTranslate } from '@core/i18n/translate';
import { Role } from '@core/models/auth.model';
import { AVERAGE_SCALE, isBelowPassMark } from '@core/models/grading';
import { periodKey } from '@core/models/period';
import { LanguageStore } from '@core/store/language/language.store';
import { SessionStore } from '@core/store/session/session.store';
import { AppBarAction, AppBarComponent } from '@shared/navigation/app-bar/app-bar';
import { TabItem, TabsComponent } from '@shared/navigation/tabs/tabs';
import { ListRowComponent, ListRowValueTone } from '@shared/data/list-row/list-row';
import { NetworkBannerComponent } from '@shared/data/network-banner/network-banner';
import { SearchFieldComponent } from '@shared/forms/search-field/search-field';
import { FooterActionComponent } from '@shared/actions/footer-action/footer-action';
import { ICONS } from '@shared/icons';

import { AssignmentStore } from '../../../assignment/state/assignment.store';
import { GradeEntryStore } from '../../../grade-entry/state/grade-entry.store';

import { ClassroomBarActions } from '../../enums/classroom-bar-actions.enum';
import { Assignment, Student } from '../../models/classroom.model';
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
  imports: [
    AppBarComponent,
    TabsComponent,
    ListRowComponent,
    NetworkBannerComponent,
    SearchFieldComponent,
    FooterActionComponent,
    TranslocoPipe,
  ],
  templateUrl: './classroom-page.html',
  styleUrl: './classroom-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomPageComponent {
  protected readonly store = inject(ClassroomStore);
  private readonly language = inject(LanguageStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly assignments = inject(AssignmentStore);
  private readonly gradeEntry = inject(GradeEntryStore);
  private readonly t = injectTranslate();

  protected readonly title = computed(() => {
    const c = this.store.current();
    return `${c.name} · ${c.subject}`;
  });

  /** School and period — « Term 2 » or « Semester 2 », after the level of the class (RM-02). */
  protected readonly subtitle = computed(() => {
    const { school, period } = this.store.current();
    return `${school} · ${this.t(periodKey('period', period.kind), { n: period.n })}`;
  });

  /** « Term average » / « Semester average », under each student's average. */
  protected readonly periodAverage = computed(() =>
    this.t(periodKey('classroom.periodAverage', this.store.current().period.kind)),
  );

  /** What the report card will show, and when — period and date are data of the class. */
  protected readonly reportCardNotice = computed(() => {
    const { period, periodCloses } = this.store.current();
    return this.t(periodKey('classroom.reportCardNotice', period.kind), {
      n: period.n,
      date: formatDate(periodCloses, this.language.language(), 'long'),
    });
  });

  protected readonly views = computed<TabItem[]>(() => [
    { id: 0, label: this.t('classroom.tabs.assignments') },
    { id: 1, label: this.t('classroom.tabs.students') },
    { id: 2, label: this.t('classroom.tabs.reportCard') },
  ]);

  /** The parent space appears only when the account also holds that role (ID-02). */
  protected readonly barActions = computed<ClassroomBarAction[]>(() => [
    ...(this.store.hasOtherClassrooms()
      ? [
          {
            action: ClassroomBarActions.SwitchClassroom,
            icon: ICONS.expand,
            label: this.t('classroom.switchClassroom'),
          },
        ]
      : []),
    { action: ClassroomBarActions.Search, icon: ICONS.search, label: this.t('common.search') },
    ...(this.session.hasRole('parent')
      ? [
          {
            action: ClassroomBarActions.ParentSpace,
            icon: ICONS.student,
            label: this.t('spaces.parent'),
          },
        ]
      : []),
    { action: ClassroomBarActions.SignOut, icon: ICONS.logout, label: this.t('common.signOut') },
  ]);

  protected assignmentMeta(a: Assignment): string {
    const language = this.language.language();
    return this.t('classroom.assignmentMeta', {
      coefficient: a.coefficient,
      scale: a.scale,
      date: formatDate(a.date, language),
    });
  }

  /** An average under the pass mark is in `danger` — never coloured against the class (RM-11). */
  protected studentTone(student: Student): ListRowValueTone {
    return isBelowPassMark(student.average, AVERAGE_SCALE) ? 'danger' : 'neutral';
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
      case ClassroomBarActions.SwitchClassroom:
        this.store.nextClassroom();
        return;
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

  /** Grade entry of this assignment, in this class. */
  protected enterGrades(assignment: Assignment): void {
    const c = this.store.current();
    this.gradeEntry.open({
      classroom: c.name,
      assignment: assignment.name,
      scale: assignment.scale,
      coefficient: assignment.coefficient,
      names: c.students.map((s) => s.name),
    });
    void this.router.navigate(['/grade-entry']);
  }

  /** A new assignment in this class: the sheet checks its date against the class calendar (RM-14). */
  protected newAssignment(): void {
    const c = this.store.current();
    this.assignments.open({
      classroom: c.name,
      subject: c.subject,
      calendar: {
        period: c.period,
        periodCloses: c.periodCloses,
        previousPeriodCloses: c.previousPeriodCloses,
      },
      existingTitles: c.assignments.map((a) => a.name),
    });
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
