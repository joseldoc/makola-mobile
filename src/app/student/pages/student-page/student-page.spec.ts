import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { provideI18n } from '@core/i18n';
import { Role } from '@core/models/auth.model';
import { LanguageStore } from '@core/store/language/language.store';

import { StudentRecordQuery } from '../../models/student-record.model';
import { MockStudentRecordApi } from '../../services/mock-student-record-api';
import { StudentRecordApi } from '../../services/student-record-api';
import { StudentPageComponent } from './student-page';

const clean = (text: string | null | undefined) => (text ?? '').replace(/ /g, ' ').trim();

describe('StudentPageComponent (US-P08)', () => {
  let fixture: ComponentFixture<StudentPageComponent>;
  const root = () => fixture.nativeElement as HTMLElement;
  const text = (selector: string) => clean(root().querySelector(selector)?.textContent);
  const rows = () => Array.from(root().querySelectorAll('app-list-row'));

  async function open(query: StudentRecordQuery, space: Role = 'teacher', backTo = '/classroom') {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideI18n(),
        { provide: StudentRecordApi, useClass: MockStudentRecordApi },
      ],
    });
    fixture = TestBed.createComponent(StudentPageComponent);
    fixture.componentRef.setInput('space', space);
    fixture.componentRef.setInput('backTo', backTo);
    fixture.componentRef.setInput('query', query);
    await fixture.whenStable();
    await fixture.whenStable();
  }

  afterEach(() => localStorage.clear());

  it('names the student, the class, the subject and the term in the bar', async () => {
    await open({ classroomId: '4b-maths', studentId: 'ilunga-marie' });

    expect(text('app-bar .title')).toBe('ILUNGA Marie');
    expect(text('app-bar .subtitle')).toBe('4ème B · Maths · Term 2');
  });

  it('shows the term average first, the class average beside it, in the interface language', async () => {
    await open({ classroomId: '4b-maths', studentId: 'ilunga-marie' });

    expect(text('.card-label')).toBe('Term average');
    expect(text('.card-value')).toBe('16.75');
    expect(text('.card-secondary')).toBe('Class average 12.68');

    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();
    expect(text('.card-label')).toBe('Moyenne du trimestre');
    expect(text('.card-value')).toBe('16,75');
    expect(text('.card-secondary')).toBe('Moyenne de la classe 12,68');
  });

  it('colours an average in danger under the pass mark of 20 only', async () => {
    await open({ classroomId: '4b-maths', studentId: 'tati-gloire' });
    expect(text('.card-value')).toBe('8.7');
    expect(root().querySelector('.card-value')!.classList).toContain('danger');
  });

  it('lists the assignments by period, the current one first, latest first', async () => {
    await open({ classroomId: '4b-maths', studentId: 'ilunga-marie' });

    const headers = Array.from(root().querySelectorAll('.period-header')).map((h) =>
      clean(h.textContent),
    );
    expect(headers).toEqual(['Term 2', 'Term 1']);
    expect(rows().map((r) => clean(r.querySelector('.primary')?.textContent))).toEqual([
      'Contrôle n°2',
      'Interrogation ch. 5',
      'Devoir maison n°1',
      'Interrogation ch. 4',
      'Interrogation ch. 3',
      'Contrôle n°1',
      'Interrogation ch. 2',
      'Interrogation ch. 1',
    ]);
  });

  it('gives each grade on its own scale, with the class average on the secondary line', async () => {
    await open({ classroomId: '4b-maths', studentId: 'ilunga-marie' });
    const [control, interro5, , interro4] = rows();

    expect(clean(control.querySelector('.value')?.textContent)).toBe('18');
    expect(clean(control.querySelector('.secondary')?.textContent)).toBe(
      'coef 2 · /20 · 12 Mar · Class average 12.4',
    );
    expect(clean(interro4.querySelector('.value')?.textContent)).toBe('9.5');
    expect(clean(interro4.querySelector('.secondary')?.textContent)).toBe(
      'coef 2 · /10 · 23 Jan · Class average 6.35',
    );
    // 9 out of 20 is under the pass mark: danger. Never against the class average.
    expect(interro5.querySelector<HTMLElement>('.value')!.style.color).toBe('var(--mk-refus)');
    expect(control.querySelector<HTMLElement>('.value')!.style.color).toBe('var(--mk-text)');
  });

  it('writes absent and not graded as words, in neutral ink (RM-15)', async () => {
    await open({ classroomId: '4b-maths', studentId: 'ilunga-marie' });
    const byName = (name: string) =>
      rows().find((r) => clean(r.querySelector('.primary')?.textContent) === name)!;

    expect(clean(byName('Interrogation ch. 2').querySelector('.value')?.textContent)).toBe(
      'Absent',
    );
    expect(clean(byName('Interrogation ch. 3').querySelector('.value')?.textContent)).toBe(
      'Not graded',
    );
    expect(byName('Interrogation ch. 2').querySelector<HTMLElement>('.value')!.style.color).toBe(
      'var(--mk-text)',
    );
  });

  it('summarises the curve for screen readers', async () => {
    await open({ classroomId: '4b-maths', studentId: 'ilunga-marie' });

    expect(clean(root().querySelector('svg.curve')!.getAttribute('aria-label'))).toBe(
      'Grade curve out of 20, with the class average of each assignment. ' +
        'Assignments: 8, from 10 Oct to 12 Mar. First grade 12.5, last grade 18. ' +
        'Without a grade: 2, absent or not graded. Term average 16.75. Class average 12.68. ' +
        'Each grade is in the list below.',
    );
  });

  it('names semesters at university: bar, average, bounds of the curve (RM-02)', async () => {
    await open({ classroomId: 'l1-maths', studentId: 'banzouzi-grace' });

    expect(text('app-bar .subtitle')).toBe('L1 Mathématiques · Analyse · Semester 2');
    expect(text('.card-label')).toBe('Semester average');
    expect(text('.card-value')).toBe('13.19');
    expect(
      Array.from(root().querySelectorAll('text.period')).map((t) => clean(t.textContent)),
    ).toEqual(['S1', 'S2']);
  });

  it('never ranks nor compares: no such word on the page', async () => {
    await open({ classroomId: '4b-maths', studentId: 'ilunga-marie' });
    const all = (
      root().textContent +
      ' ' +
      root().querySelector('svg')!.getAttribute('aria-label')
    ).toLowerCase();
    for (const word of [
      'rank',
      'position',
      'quartile',
      'above the',
      'below the class',
      'better',
      'worse',
      'than the class',
    ]) {
      expect(all).not.toContain(word);
    }
  });

  it('takes the tint of its space, and goes back where the route says', async () => {
    await open({ classroomId: '4b-maths', studentId: 'ilunga-marie' }, 'parent', '/parent-feed');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    expect(root().querySelector<HTMLElement>('app-bar .app-bar')!.style.background).toBe(
      'var(--mk-role-parent)',
    );
    root().querySelector<HTMLButtonElement>('app-bar-target button')!.click();
    expect(navigate).toHaveBeenCalledWith('/parent-feed');
  });

  it('says what to do when the record is refused', async () => {
    await open({ classroomId: '4b-maths', studentId: 'nobody' });

    expect(text('.state')).toBe(
      'These grades cannot be shown. Go back and open them again from the previous screen.',
    );
    expect(root().querySelector('app-grade-curve')).toBeNull();
  });
});
