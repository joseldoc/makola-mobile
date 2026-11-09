import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { formatDate, formatDateParts, formatDecimal } from '@core/i18n/format';
import { injectTranslate } from '@core/i18n/translate';
import { Role } from '@core/models/auth.model';
import { AVERAGE_SCALE, isBelowPassMark } from '@core/models/grading';
import { Period, periodKey } from '@core/models/period';
import { LanguageStore } from '@core/store/language/language.store';
import { ListRowComponent, ListRowValueTone } from '@shared/data/list-row/list-row';
import { AppBarComponent } from '@shared/navigation/app-bar/app-bar';

import {
  CurveLabels,
  CurvePoint,
  GradeCurveComponent,
} from '../../components/grade-curve/grade-curve';
import { RecordedAssignment, StudentRecordQuery } from '../../models/student-record.model';
import { StudentStore } from '../../state/student.store';

/** A row of the list under the curve — its accessible detail. */
interface AssignmentRow {
  key: string;
  name: string;
  meta: string;
  value: string;
  tone: ListRowValueTone;
}

interface PeriodGroup {
  key: string;
  label: string;
  rows: AssignmentRow[];
}

/**
 * A student's page (US-P08), in the teacher's space (from the classroom's
 * students) and in the parent's (their child, in the one subject of the teacher
 * who invited them, A-19): the period average, beside the class's; the curve of
 * the year; the list of assignments, latest first.
 *
 * The class average is shown beside the student's, on the curve as a reference
 * line, never compared (RM-11 as amended, A-11 decided on 8 November 2026): no
 * colour, arrow or sentence ties one to the other, and no rank.
 */
@Component({
  selector: 'app-student-page',
  imports: [AppBarComponent, ListRowComponent, GradeCurveComponent, TranslocoPipe],
  providers: [StudentStore],
  templateUrl: './student-page.html',
  styleUrl: './student-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPageComponent {
  /** From the route: whose space the page is in (tint) — `data.space`. */
  readonly space = input.required<Role>();
  /** From the route: where « back » leads — `data.backTo`. */
  readonly backTo = input.required<string>();
  /** From the route's resolver: the address (teacher) or the parent's link (A-19). */
  readonly query = input.required<StudentRecordQuery>();

  protected readonly store = inject(StudentStore);
  private readonly language = inject(LanguageStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();

  protected readonly scrolled = signal(false);

  constructor() {
    effect(() => {
      const query = this.query();
      untracked(() => void this.store.load(query));
    });
  }

  protected readonly title = computed(() => this.store.record()?.student ?? '');

  /** Class · subject · period — « 4ème B · Maths · Term 2 ». */
  protected readonly subtitle = computed(() => {
    const r = this.store.record();
    if (!r) return '';
    return `${r.classroom} · ${r.subject} · ${this.periodName(r.period)}`;
  });

  /** « Term average » / « Semester average ». */
  protected readonly averageLabel = computed(() => {
    const r = this.store.record();
    return r ? this.t(periodKey('student.average', r.period.kind)) : '';
  });

  protected readonly average = computed(() => {
    const value = this.store.average();
    return value === null ? null : this.decimal(value);
  });

  /** Under the pass mark of 20: `danger` — never coloured against the class (RM-11). */
  protected readonly averageBelowPass = computed(() => {
    const value = this.store.average();
    return value !== null && isBelowPassMark(value, AVERAGE_SCALE);
  });

  /** « No grade yet this term »: the average is not a zero. */
  protected readonly noGrade = computed(() => {
    const r = this.store.record();
    return r ? this.t(periodKey('student.noGrade', r.period.kind)) : '';
  });

  protected readonly classAverage = computed(() => {
    const value = this.store.classAverage();
    return value === null
      ? null
      : this.t('student.classSubjectAverage', { value: this.decimal(value) });
  });

  /** The curve, out of 20; dates and period names in the interface language. */
  protected readonly points = computed<CurvePoint[]>(() => {
    const language = this.language.language();
    return this.store.curve().map(({ assignment, grade, code, classAverage }) => ({
      value: grade,
      code,
      reference: classAverage,
      ...formatDateParts(assignment.date, language),
      period: this.t(periodKey('student.curve.period', assignment.period.kind), {
        n: assignment.period.n,
      }),
    }));
  });

  protected readonly curveLabels = computed<CurveLabels>(() => ({
    student: this.title(),
    reference: this.t('student.curve.reference'),
    absent: this.t('keypad.absent'),
    ungraded: this.t('keypad.ungraded'),
  }));

  /** What a screen reader hears instead of the drawing; the list gives the detail. */
  protected readonly curveSummary = computed(() => {
    const r = this.store.record();
    const curve = this.store.curve();
    if (!r || !curve.length) return '';
    const language = this.language.language();
    const grades = curve.flatMap((c) => (c.grade === null ? [] : [c.grade]));
    const codes = curve.length - grades.length;
    const average = this.store.average();
    const classAverage = this.store.classAverage();
    return [
      this.t('student.curve.summary', {
        count: curve.length,
        first: formatDate(curve[0].assignment.date, language),
        last: formatDate(curve[curve.length - 1].assignment.date, language),
      }),
      grades.length
        ? this.t('student.curve.grades', {
            first: this.decimal(grades[0]),
            last: this.decimal(grades[grades.length - 1]),
          })
        : this.t('student.curve.noGrade'),
      codes ? this.t('student.curve.codes', { count: codes }) : '',
      average === null
        ? ''
        : this.t(periodKey('student.curve.average', r.period.kind), {
            value: this.decimal(average),
          }),
      classAverage === null
        ? ''
        : this.t('student.curve.classAverage', { value: this.decimal(classAverage) }),
      this.t('student.curve.detail'),
    ]
      .filter(Boolean)
      .join(' ');
  });

  /** The list, by period — the current one first — and latest first, like the classroom screen. */
  protected readonly groups = computed<PeriodGroup[]>(() => {
    const r = this.store.record();
    if (!r) return [];
    const groups: PeriodGroup[] = [];
    for (const a of [...r.assignments].reverse()) {
      const key = `${a.period.kind}-${a.period.n}`;
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, label: this.periodName(a.period), rows: [] };
        groups.push(group);
      }
      group.rows.push(this.row(a));
    }
    // Current period first, whatever the order of the dates.
    return groups.sort(
      (a, b) =>
        Number(b.key === `${r.period.kind}-${r.period.n}`) -
        Number(a.key === `${r.period.kind}-${r.period.n}`),
    );
  });

  protected onScroll(event: Event): void {
    this.scrolled.set((event.currentTarget as HTMLElement).scrollTop > 0);
  }

  protected goBack(): void {
    void this.router.navigateByUrl(this.backTo());
  }

  /**
   * Name and date, coefficient, scale; then the class average on the secondary
   * line (4.5:1, the tertiary line does not hold it). The grade on its own scale
   * stays the row's value, in `danger` under that scale's pass mark only.
   */
  private row(a: RecordedAssignment): AssignmentRow {
    const language = this.language.language();
    const meta = this.t('student.assignmentMeta', {
      coefficient: a.coefficient,
      scale: a.scale,
      date: formatDate(a.date, language),
    });
    const withClass =
      a.classAverage === undefined
        ? meta
        : `${meta} · ${this.t('student.classAverage', { value: this.decimal(a.classAverage) })}`;
    const result = a.result;
    return {
      key: `${a.date}-${a.name}`,
      name: a.name,
      meta: withClass,
      value: result.kind === 'grade' ? this.decimal(result.value) : this.t(`keypad.${result.kind}`),
      tone:
        result.kind === 'grade' && isBelowPassMark(result.value, a.scale) ? 'danger' : 'neutral',
    };
  }

  private periodName(period: Period): string {
    return this.t(periodKey('period', period.kind), { n: period.n });
  }

  private decimal(value: number): string {
    return formatDecimal(value, this.language.language());
  }
}
