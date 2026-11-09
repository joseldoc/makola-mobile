import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurvePoint, GradeCurveComponent } from './grade-curve';

const point = (
  value: number | null,
  reference: number | null,
  period: string,
  code: CurvePoint['code'] = null,
): CurvePoint => ({ value, code, reference, day: '1', month: 'Mar', period });

/** Above, below, equal to the class average, then two codes — over two terms. */
const POINTS: CurvePoint[] = [
  point(12.5, 11, 'T1'),
  point(null, 11.4, 'T1', 'absent'),
  point(14, 12, 'T1'),
  point(null, 12.2, 'T1', 'ungraded'),
  point(19, 12.7, 'T2'),
  point(9, 11.8, 'T2'),
  point(12.4, 12.4, 'T2'),
];

describe('GradeCurveComponent (A-11: the class average as a neutral reference)', () => {
  let fixture: ComponentFixture<GradeCurveComponent>;
  const svg = () => (fixture.nativeElement as HTMLElement).querySelector('svg.curve')!;
  const all = (selector: string) => Array.from(svg().querySelectorAll(selector));

  beforeEach(async () => {
    fixture = TestBed.createComponent(GradeCurveComponent);
    fixture.componentRef.setInput('points', POINTS);
    fixture.componentRef.setInput('labels', {
      student: 'ILUNGA Marie',
      reference: 'Class average',
      absent: 'Absent',
      ungraded: 'Not graded',
    });
    fixture.componentRef.setInput('ariaLabel', 'Grade curve out of 20. Assignments: 7.');
    await fixture.whenStable();
  });

  it('is one image for screen readers, summarised by its label', () => {
    expect(svg().getAttribute('role')).toBe('img');
    expect(svg().getAttribute('aria-label')).toBe('Grade curve out of 20. Assignments: 7.');
  });

  it('draws one point per grade, and none for a code', () => {
    expect(all('circle.point')).toHaveLength(5);
  });

  it('puts absent and not graded under the plot, never at zero (RM-15)', () => {
    const zeroY = Number(all('line.grid')[0].getAttribute('y1'));
    const absent = all('circle.code.absent');
    const ungraded = all('rect.code.ungraded');
    expect(absent).toHaveLength(1);
    expect(ungraded).toHaveLength(1);
    expect(Number(absent[0].getAttribute('cy'))).toBeGreaterThan(zeroY);
    expect(Number(ungraded[0].getAttribute('y'))).toBeGreaterThan(zeroY);
    for (const dot of all('circle.point')) {
      expect(Number(dot.getAttribute('cy'))).toBeLessThan(zeroY);
    }
  });

  it('breaks the student’s line at each code, not the class average’s', () => {
    const student = svg().querySelector('path.student')!.getAttribute('d')!;
    const reference = svg().querySelector('path.reference')!.getAttribute('d')!;
    // 12.5 | (absent) | 14 | (not graded) | 19 9 12.4: three runs.
    expect(student.match(/M/g)).toHaveLength(3);
    expect(reference.match(/M/g)).toHaveLength(1);
  });

  it('marks the bound between two periods, with each period’s name', () => {
    expect(all('line.bound')).toHaveLength(1);
    expect(all('text.period').map((t) => t.textContent!.trim())).toEqual(['T1', 'T2']);
    // Between the 4th and the 5th assignment.
    const x = Number(all('line.bound')[0].getAttribute('x1'));
    const dots = all('circle.point').map((d) => Number(d.getAttribute('cx')));
    expect(x).toBeGreaterThan(dots[1]);
    expect(x).toBeLessThan(dots[2]);
  });

  it('never compares: one style per line, whatever its position against the class (RM-11)', () => {
    // Points above, below and equal to the class average: same class, no inline colour.
    const classes = new Set(all('circle.point').map((d) => d.getAttribute('class')));
    expect([...classes]).toEqual(['point']);
    for (const el of all('*')) {
      expect(el.getAttribute('fill')).toBeNull();
      expect(el.getAttribute('stroke')).toBeNull();
      expect(el.getAttribute('style')).toBeNull();
    }
    // No area between the two lines: two paths only, both unfilled lines.
    expect(all('path').map((p) => p.getAttribute('class'))).toEqual(['reference', 'student']);
    expect(all('polygon, area')).toHaveLength(0);
  });

  it('draws the pass mark as an ordinary grid line: 0, 10 and 20 alike', () => {
    expect(all('line.grid')).toHaveLength(3);
    expect(
      all('text.axis')
        .slice(0, 3)
        .map((t) => t.textContent!.trim()),
    ).toEqual(['0', '10', '20']);
  });

  it('labels each assignment with its date, on two lines', () => {
    // 7 slots of 41.7 px at the default width: every date fits.
    expect(all('text.axis').length).toBe(3 + 2 * POINTS.length);
  });

  it('shows the legend of codes only when the curve has them', async () => {
    const legend = () =>
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.legend li')).map((li) =>
        li.textContent!.trim(),
      );
    expect(legend()).toEqual(['ILUNGA Marie', 'Class average', 'Absent', 'Not graded']);

    fixture.componentRef.setInput('points', [point(12, 11, 'T1'), point(14, 12, 'T1')]);
    await fixture.whenStable();
    expect(legend()).toEqual(['ILUNGA Marie', 'Class average']);
    expect(all('line.bound')).toHaveLength(0);
  });
});
