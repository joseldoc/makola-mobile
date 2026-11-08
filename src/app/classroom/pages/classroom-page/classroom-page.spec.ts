import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { provideI18n } from '@core/i18n';
import { Session } from '@core/models/auth.model';
import { LanguageStore } from '@core/store/language/language.store';
import { SessionStore } from '@core/store/session/session.store';

import { AssignmentStore } from '../../../assignment/state/assignment.store';
import { GradeEntryStore } from '../../../grade-entry/state/grade-entry.store';
import { ClassroomStore } from '../../state/classroom.store';

import { ClassroomPageComponent } from './classroom-page';

describe('ClassroomPageComponent — assignment rows', () => {
  let fixture: ComponentFixture<ClassroomPageComponent>;

  const rows = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('app-list-row'));

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideI18n()] });
    fixture = TestBed.createComponent(ClassroomPageComponent);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('labels the value of each assignment as the class average (RM-11 as amended)', () => {
    const first = rows()[0];
    expect(first.querySelector('.tertiary')!.textContent!.trim()).toBe('Class average');
    expect(first.querySelector('.value')!.textContent!.trim()).toBe('12.4');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('not calculated');
  });

  it('never ranks: no assignment row says rank or position', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent!.toLowerCase();
    for (const word of ['rank', 'position', 'quartile', 'above', 'below the class']) {
      expect(text).not.toContain(word);
    }
  });
});

describe('ClassroomPageComponent — report card notice (US-P09)', () => {
  let fixture: ComponentFixture<ClassroomPageComponent>;

  const notice = () =>
    (fixture.nativeElement as HTMLElement)
      .querySelector('.report-card')!
      .textContent!.replace(/\u00a0/g, ' ')
      .trim();

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideI18n()] });
    fixture = TestBed.createComponent(ClassroomPageComponent);
    TestBed.inject(ClassroomStore).setView(2);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('takes the term and its closing date from the class, in the interface language', async () => {
    expect(notice()).toContain(
      'The term 2 report card will be available once the term closes, on 27 March 2026.',
    );

    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();
    expect(notice()).toContain(
      'Le bulletin du trimestre 2 sera disponible après sa clôture, le 27 mars 2026.',
    );
  });

  it('states the limit: the class average per subject, and no rank (RM-11 as amended)', () => {
    expect(notice()).toContain('the class average beside the student');
    expect(notice()).toMatch(/no rank\.$/);
  });
});

describe('ClassroomPageComponent — app-bar actions and the parent space (ID-02)', () => {
  const identifier = { channel: 'phone', value: '+242066123456' } as const;
  let fixture: ComponentFixture<ClassroomPageComponent>;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  async function open(stored: Session): Promise<void> {
    localStorage.clear();
    localStorage.setItem('mk.session', JSON.stringify(stored));
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideI18n()] });
    navigateByUrl = vi.fn().mockResolvedValue(true);
    TestBed.inject(Router).navigateByUrl = navigateByUrl as unknown as Router['navigateByUrl'];
    fixture = TestBed.createComponent(ClassroomPageComponent);
    await fixture.whenStable();
  }

  const targets = () =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        'app-bar-target button',
      ),
    );
  const labels = () => targets().map((b) => b.getAttribute('aria-label'));
  const press = (label: string) =>
    targets()
      .find((b) => b.getAttribute('aria-label') === label)!
      .click();
  const session = () => TestBed.inject(SessionStore);

  afterEach(() => localStorage.clear());

  it('teacher only: no parent space action', async () => {
    await open({ id: 'a1', identifier, activeRole: 'teacher', roles: { teacher: 'ready' } });

    expect(labels()).toEqual(['Change class', 'Search', 'Sign out']);
  });

  it('teacher only: sign out still signs out, the index no longer points elsewhere', async () => {
    await open({ id: 'a1', identifier, activeRole: 'teacher', roles: { teacher: 'ready' } });

    press('Sign out');

    expect(session().signedIn()).toBe(false);
    expect(navigateByUrl).toHaveBeenCalledWith('/auth', { replaceUrl: true });
  });

  it('teacher and parent: the parent space action sits between search and sign out', async () => {
    await open({
      id: 'a1',
      identifier,
      activeRole: 'teacher',
      roles: { teacher: 'ready', parent: 'ready' },
    });

    expect(labels()).toEqual(['Change class', 'Search', 'Parent space', 'Sign out']);
  });

  it('a press shows the parent space, kept for the next launch', async () => {
    await open({
      id: 'a1',
      identifier,
      activeRole: 'teacher',
      roles: { teacher: 'ready', parent: 'ready' },
    });

    press('Parent space');

    expect(session().activeRole()).toBe('parent');
    expect(JSON.parse(localStorage.getItem('mk.session')!).activeRole).toBe('parent');
    expect(navigateByUrl).toHaveBeenCalledWith('/parent-feed', { replaceUrl: true });
  });

  it('a press opens the parent alerts first when they are still to set', async () => {
    await open({
      id: 'a1',
      identifier,
      activeRole: 'teacher',
      roles: { teacher: 'ready', parent: 'setup' },
    });

    press('Parent space');

    expect(navigateByUrl).toHaveBeenCalledWith('/auth/alerts', { replaceUrl: true });
  });

  it('with two roles, sign out still signs out — every role at once', async () => {
    await open({
      id: 'a1',
      identifier,
      activeRole: 'teacher',
      roles: { teacher: 'ready', parent: 'ready' },
    });

    press('Sign out');

    expect(session().signedIn()).toBe(false);
    expect(navigateByUrl).toHaveBeenCalledWith('/auth', { replaceUrl: true });
  });

  it('search still opens the students view', async () => {
    await open({
      id: 'a1',
      identifier,
      activeRole: 'teacher',
      roles: { teacher: 'ready', parent: 'ready' },
    });

    press('Search');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-search-field')).toBeTruthy();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});

describe('ClassroomPageComponent — a university class has semesters (RM-02, A-12)', () => {
  let fixture: ComponentFixture<ClassroomPageComponent>;

  const root = () => fixture.nativeElement as HTMLElement;
  const clean = (text: string | null | undefined) => (text ?? '').replace(/\u00a0/g, ' ').trim();
  const bar = (part: string) => clean(root().querySelector(`app-bar .${part}`)?.textContent);
  const press = (label: string) =>
    Array.from(root().querySelectorAll<HTMLButtonElement>('app-bar-target button'))
      .find((b) => b.getAttribute('aria-label') === label)!
      .click();
  const store = () => TestBed.inject(ClassroomStore);

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideI18n()] });
    TestBed.inject(Router).navigate = vi.fn().mockResolvedValue(true);
    fixture = TestBed.createComponent(ClassroomPageComponent);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('4ème B shows its term; « Change class » shows the university class and its semester', async () => {
    expect(bar('title')).toBe('4ème B · Maths');
    expect(bar('subtitle')).toBe('Lycée Chaminade · Term 2');

    press('Change class');
    await fixture.whenStable();

    expect(bar('title')).toBe('L1 Mathématiques · Analyse');
    expect(bar('subtitle')).toBe('Université du Djoué · Semester 2');

    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();
    expect(bar('subtitle')).toBe('Université du Djoué · Semestre 2');

    press('Changer de classe');
    await fixture.whenStable();
    expect(bar('subtitle')).toBe('Lycée Chaminade · Trimestre 2');
  });

  it('students: a semester average, in danger under the pass mark of 20 only', async () => {
    store().nextClassroom();
    store().setView(1);
    await fixture.whenStable();

    const rows = Array.from(root().querySelectorAll('app-list-row'));
    expect(clean(rows[0].querySelector('.secondary')?.textContent)).toBe('Semester average');
    const tones = rows.map((r) => r.querySelector<HTMLElement>('.value')!.style.color);
    // ELENGA 9.6 and MAKAYA 7.85 are under 10 out of 20.
    expect(tones).toEqual([
      'var(--mk-text)',
      'var(--mk-refus)',
      'var(--mk-text)',
      'var(--mk-refus)',
      'var(--mk-text)',
    ]);

    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();
    expect(clean(root().querySelector('app-list-row .secondary')?.textContent)).toBe(
      'Moyenne du semestre',
    );
  });

  it('report card: the semester and its closing date, in both languages', async () => {
    store().nextClassroom();
    store().setView(2);
    await fixture.whenStable();
    const notice = () => clean(root().querySelector('.report-card')?.textContent);

    expect(notice()).toContain(
      'The semester 2 report card will be available once the semester closes, on 12 June 2026.',
    );
    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();
    expect(notice()).toContain(
      'Le bulletin du semestre 2 sera disponible après sa clôture, le 12 juin 2026.',
    );
  });

  it('the new assignment sheet opens on the calendar of the class shown', async () => {
    store().nextClassroom();
    await fixture.whenStable();

    press('Change class');
    press('Change class');
    // Back on L1 Mathématiques after a full turn.
    expect(store().current().name).toBe('L1 Mathématiques');

    root().querySelector<HTMLButtonElement>('app-footer-action button')!.click();
    const sheet = TestBed.inject(AssignmentStore);
    expect(sheet.classroom()).toBe('L1 Mathématiques');
    expect(sheet.currentDate().message.key).toBe('assignment.date.inPeriod.semester');
    sheet.nextDate();
    expect(sheet.currentDate().message.key).toBe('assignment.date.afterLastClose.semester');
    sheet.nextDate();
    expect(sheet.currentDate().state).toBe('error');
    sheet.setTitle('Partiel n°1');
    expect(sheet.titleMessage()?.key).toBe('assignment.titleErrors.duplicate.semester');
  });

  it('a row opens the grade entry of that assignment, on its scale', async () => {
    store().nextClassroom();
    await fixture.whenStable();

    root().querySelectorAll<HTMLElement>('app-list-row .list-row')[1].click();
    const entry = TestBed.inject(GradeEntryStore);
    expect(entry.assignment()).toBe('TD n°4');
    expect(entry.classroom()).toBe('L1 Mathématiques');
    expect(entry.scale()).toBe(10);
    expect(entry.names()).toHaveLength(5);
    expect(entry.entered()).toBe(0);
  });
});
