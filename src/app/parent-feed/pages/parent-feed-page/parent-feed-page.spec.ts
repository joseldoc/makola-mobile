import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';

import { provideI18n } from '@core/i18n';
import { Session } from '@core/models/auth.model';
import { LanguageStore } from '@core/store/language/language.store';
import { SessionStore } from '@core/store/session/session.store';

import { ParentFeedStore } from '../../state/parent-feed.store';
import { ParentFeedPageComponent } from './parent-feed-page';

describe('ParentFeedPageComponent — class average next to the child’s grade', () => {
  let fixture: ComponentFixture<ParentFeedPageComponent>;

  const rows = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('app-list-row'));
  // Non-breaking spaces keep « Class average 12.4 » on one line; compared as plain spaces.
  const text = (row: Element, part: string) =>
    (row.querySelector(`.${part}`)?.textContent ?? '').replace(/\u00a0/g, ' ').trim();

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideI18n()] });
    fixture = TestBed.createComponent(ParentFeedPageComponent);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('shows the class average on a grade row, the child’s grade staying the value (en)', () => {
    const [newGrade, belowPass] = rows();
    expect(text(newGrade, 'value')).toBe('18');
    expect(text(newGrade, 'secondary')).toBe('Contrôle n°2 · Maths · coef 2 · Class average 12.4');
    expect(text(belowPass, 'value')).toBe('9');
    expect(text(belowPass, 'secondary')).toBe('Interrogation ch. 5 · Maths · Class average 11.8');
  });

  it('formats the class average in the interface language (fr)', async () => {
    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();

    const [newGrade, belowPass] = rows();
    expect(text(newGrade, 'secondary')).toBe(
      'Contrôle n°2 · Maths · coef 2 · Moyenne de la classe 12,4',
    );
    expect(text(belowPass, 'secondary')).toBe(
      'Interrogation ch. 5 · Maths · Moyenne de la classe 11,8',
    );
  });

  it('shows nothing about a class average on rows without one (test announced, report card)', () => {
    const [, , testAnnounced, reportCard] = rows();
    for (const row of [testAnnounced, reportCard]) {
      expect(row.textContent!.replace(/\u00a0/g, ' ')).not.toContain('Class average');
      expect(text(row, 'secondary')).not.toMatch(/·\s*$/);
    }
  });

  it('does not compare: the tone of a grade follows the pass mark only', () => {
    const [newGrade, belowPass] = rows();
    // 18 is above the class average 12.4: still neutral ink, never green.
    expect(newGrade.querySelector<HTMLElement>('.value')!.style.color).toBe('var(--mk-text)');
    // 9 is under the pass mark of 10: danger, because of the pass mark.
    expect(belowPass.querySelector<HTMLElement>('.value')!.style.color).toBe('var(--mk-refus)');
  });
});

describe('ParentFeedPageComponent — class average in the subject card (RM-11, 7 November)', () => {
  let fixture: ComponentFixture<ParentFeedPageComponent>;

  const card = () => (fixture.nativeElement as HTMLElement).querySelector('.card.highlight')!;
  const text = (part: string) =>
    (card().querySelector(`.${part}`)?.textContent ?? '').replace(/ /g, ' ').trim();

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideI18n()] });
    fixture = TestBed.createComponent(ParentFeedPageComponent);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('shows the class average beside the child’s, which stays the card’s value (en)', () => {
    expect(text('card-label')).toBe('Average · Maths');
    expect(text('card-value')).toBe('16.75');
    expect(text('card-secondary')).toBe('Class average 12.68');
    expect(card().querySelectorAll('.card-value')).toHaveLength(1);
  });

  it('formats it in the interface language (fr)', async () => {
    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();

    expect(text('card-label')).toBe('Moyenne · Maths');
    expect(text('card-value')).toBe('16,75');
    expect(text('card-secondary')).toBe('Moyenne de la classe 12,68');
  });

  it('shows nothing more without a class average — neither zero nor dash', async () => {
    patchState(unprotected(TestBed.inject(ParentFeedStore)), { classSubjectAverage: undefined });
    await fixture.whenStable();

    expect(card().querySelector('.card-secondary')).toBeNull();
    expect(text('card-value')).toBe('16.75');
    expect(card().textContent!.replace(/ /g, ' ').replace(/\s+/g, ' ').trim()).toBe(
      'Average · Maths 16.75',
    );
  });

  it('does not compare: no tone, icon or arrow tied to the class average', async () => {
    const before = card().querySelector<HTMLElement>('.card-secondary')!;
    expect(before.getAttribute('style')).toBeNull();
    expect(before.querySelector('ion-icon')).toBeNull();
    expect(before.textContent).not.toMatch(/[↑↓▲▼]|above|below/i);

    // A class average higher than the child's changes nothing but the number.
    patchState(unprotected(TestBed.inject(ParentFeedStore)), { classSubjectAverage: 17.5 });
    await fixture.whenStable();
    const after = card().querySelector<HTMLElement>('.card-secondary')!;
    expect(after.className).toBe(before.className);
    expect(after.getAttribute('style')).toBeNull();
    expect(text('card-secondary')).toBe('Class average 17.5');
  });
});

describe('ParentFeedPageComponent — term card: a date, never a judgement of the child', () => {
  let fixture: ComponentFixture<ParentFeedPageComponent>;

  const card = () => (fixture.nativeElement as HTMLElement).querySelectorAll('.card')[1];
  const text = () => card().textContent!.replace(/\u00a0/g, ' ');
  const part = (name: string) =>
    card()
      .querySelector(`.${name}`)!
      .textContent!.replace(/\u00a0/g, ' ')
      .trim();

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideI18n()] });
    fixture = TestBed.createComponent(ParentFeedPageComponent);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('states when the term closes, in the interface language', async () => {
    expect(part('card-label')).toBe('Term 2');
    expect(part('card-detail')).toBe('Closes on 27 Mar');

    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();
    expect(part('card-label')).toBe('Trimestre 2');
    expect(part('card-detail')).toBe('Clôture le 27 mars');
  });

  it('carries no arrow, trend word or colour: a colour never rewards a student', () => {
    expect(text()).not.toMatch(/[↑↓▲▼]|improving|progress/i);
    expect(card().querySelector('ion-icon, app-icon')).toBeNull();
    const detail = card().querySelector<HTMLElement>('.card-detail')!;
    expect(detail.getAttribute('style')).toBeNull();
    expect(card().querySelector('.card-progress')).toBeNull();
  });
});

describe('ParentFeedPageComponent — app-bar actions and the teacher space (ID-02)', () => {
  const identifier = { channel: 'phone', value: '+242066123456' } as const;
  let fixture: ComponentFixture<ParentFeedPageComponent>;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  async function open(stored: Session): Promise<void> {
    localStorage.clear();
    localStorage.setItem('mk.session', JSON.stringify(stored));
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideI18n()] });
    navigateByUrl = vi.fn().mockResolvedValue(true);
    TestBed.inject(Router).navigateByUrl = navigateByUrl as unknown as Router['navigateByUrl'];
    fixture = TestBed.createComponent(ParentFeedPageComponent);
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

  afterEach(() => localStorage.clear());

  it('parent only: no teacher space action; sign out still signs out', async () => {
    await open({ id: 'a1', identifier, activeRole: 'parent', roles: { parent: 'ready' } });

    expect(labels()).toEqual(['Switch child', 'Sign out']);
    press('Sign out');
    expect(TestBed.inject(SessionStore).signedIn()).toBe(false);
    expect(navigateByUrl).toHaveBeenCalledWith('/auth', { replaceUrl: true });
  });

  it('parent and teacher: a press on the teacher space shows it', async () => {
    await open({
      id: 'a1',
      identifier,
      activeRole: 'parent',
      roles: { parent: 'ready', teacher: 'ready' },
    });

    expect(labels()).toEqual(['Switch child', 'Teacher space', 'Sign out']);
    press('Teacher space');
    expect(TestBed.inject(SessionStore).activeRole()).toBe('teacher');
    expect(navigateByUrl).toHaveBeenCalledWith('/classroom', { replaceUrl: true });
  });
});
