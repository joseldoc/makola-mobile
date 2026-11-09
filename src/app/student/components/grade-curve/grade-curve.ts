import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

/** One assignment on the curve — everything already scaled and formatted by the page. */
export interface CurvePoint {
  /** The student's grade out of `max`; `null` for « absent » or « not graded ». */
  value: number | null;
  /** A code: a marker under the plot, never a point at zero (RM-15). */
  code: 'absent' | 'ungraded' | null;
  /** The class average out of `max`, `null` without one. */
  reference: number | null;
  /** Short date on two lines: « 12 » / « mars ». */
  day: string;
  month: string;
  /** Short name of its period: « T1 », « S2 ». */
  period: string;
}

/** The legend's words, already translated. */
export interface CurveLabels {
  student: string;
  reference: string;
  absent: string;
  ungraded: string;
}

/** Measured once the page is laid out; a 360 dp screen less its two 16 dp margins until then. */
const DEFAULT_WIDTH = 328;
/** Room for « 20 » at 12 px, right-aligned, and a gap. */
const LEFT = 28;
const RIGHT_GAP = 8;
/** Strip of the period names, above the plot. */
const TOP = 24;
const PLOT_HEIGHT = 136;
const BOTTOM = TOP + PLOT_HEIGHT;
/** Strip of the code markers: under the plot, so that none reads as a zero. */
const CODE_Y = BOTTOM + 12;
const DAY_Y = BOTTOM + 32;
const MONTH_Y = BOTTOM + 46;
const HEIGHT = BOTTOM + 52;
/** Narrowest slot that holds « janv. » at 12 px: under it, every other date is shown. */
const MIN_LABEL_STEP = 34;

/**
 * A student's grade curve (US-P08, A-11 decided on 8 November 2026): the
 * assignments in chronological order, the student's grades as a solid ink line,
 * the class average of each assignment as a dashed reference line, the period
 * bounds as thin vertical lines with their names, codes under the plot.
 *
 * Never a comparison (RM-11): the two lines have one style each, whatever their
 * positions — no colour, no filled area between them, no arrow. The pass mark is
 * an ordinary grid line (0, half, max), with no colour and no label of its own:
 * the list under the curve already shows a grade under it in `danger`.
 *
 * Presentational: no store, no service, no interaction (nothing to tap, hence no
 * target). The SVG is one image for screen readers (`role="img"`, `ariaLabel`
 * summarises it); the list of the page is its accessible detail.
 * Written for this screen — the design system has no chart yet.
 */
@Component({
  selector: 'app-grade-curve',
  templateUrl: './grade-curve.html',
  styleUrl: './grade-curve.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeCurveComponent {
  readonly points = input.required<readonly CurvePoint[]>();
  readonly labels = input.required<CurveLabels>();
  /** The summary read instead of the drawing: count, first and last grade, average. */
  readonly ariaLabel = input.required<string>();
  /** Top of the axis — 20, the scale every grade is brought to. */
  readonly max = input(20);

  protected readonly left = LEFT;
  protected readonly bottom = BOTTOM;
  protected readonly height = HEIGHT;
  protected readonly codeY = CODE_Y;
  protected readonly dayY = DAY_Y;
  protected readonly monthY = MONTH_Y;

  /** Drawn at the width it is given: text stays at its size in px (12 px floor). */
  protected readonly width = signal(DEFAULT_WIDTH);
  protected readonly right = computed(() => this.width() - RIGHT_GAP);
  private readonly step = computed(() => (this.right() - LEFT) / Math.max(1, this.points().length));

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (host.clientWidth > 0) this.width.set(host.clientWidth);
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => {
        const measured = Math.floor(entry.contentRect.width);
        if (measured > 0) this.width.set(measured);
      });
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Centre of the i-th assignment's slot. */
  private x(i: number): number {
    return LEFT + this.step() * (i + 0.5);
  }

  private y(value: number): number {
    return TOP + (1 - value / this.max()) * PLOT_HEIGHT;
  }

  /** 0, half the scale, the scale: three grid lines alike — the half is not singled out. */
  protected readonly ticks = computed(() => {
    const max = this.max();
    return [0, max / 2, max].map((value) => ({ value, y: this.y(value) }));
  });

  /** A vertical line between the last assignment of a period and the first of the next. */
  protected readonly bounds = computed(() => {
    const points = this.points();
    const step = this.step();
    return points.flatMap((p, i) =>
      i > 0 && p.period !== points[i - 1].period ? [LEFT + step * i] : [],
    );
  });

  /** Each period's name, centred over its assignments. */
  protected readonly periods = computed(() => {
    const groups: { label: string; first: number; last: number }[] = [];
    this.points().forEach((p, i) => {
      const current = groups.at(-1);
      if (current && current.label === p.period) current.last = i;
      else groups.push({ label: p.period, first: i, last: i });
    });
    return groups.map((g) => ({ label: g.label, x: (this.x(g.first) + this.x(g.last)) / 2 }));
  });

  /** The student's line, broken at a code: no segment runs through an absence. */
  protected readonly studentPath = computed(() => this.path(this.points().map((p) => p.value)));

  /** The class average's line, broken only where the server has none. */
  protected readonly referencePath = computed(() =>
    this.path(this.points().map((p) => p.reference)),
  );

  /** A dot per grade, in the same ink whatever the class average (RM-11). */
  protected readonly dots = computed(() =>
    this.points().flatMap((p, i) =>
      p.value === null ? [] : [{ x: this.x(i), y: this.y(p.value) }],
    ),
  );

  protected readonly codes = computed(() =>
    this.points().flatMap((p, i) => (p.code ? [{ x: this.x(i), code: p.code }] : [])),
  );

  /** Dates under their slot; every other one when the slots are too narrow for them. */
  protected readonly dates = computed(() => {
    const every = Math.max(1, Math.ceil(MIN_LABEL_STEP / this.step()));
    return this.points().flatMap((p, i) =>
      i % every === 0 ? [{ x: this.x(i), day: p.day, month: p.month }] : [],
    );
  });

  protected hasCode(code: 'absent' | 'ungraded'): boolean {
    return this.points().some((p) => p.code === code);
  }

  /** `M`/`L` commands through consecutive values, a new `M` after each gap. */
  private path(values: readonly (number | null)[]): string {
    let d = '';
    let drawing = false;
    values.forEach((v, i) => {
      if (v === null) {
        drawing = false;
        return;
      }
      d += `${drawing ? 'L' : 'M'}${this.x(i).toFixed(1)} ${this.y(v).toFixed(1)} `;
      drawing = true;
    });
    return d.trim();
  }
}
