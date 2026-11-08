import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { provideI18n } from '@core/i18n';
import { Session } from '@core/models/auth.model';
import { SessionStore } from '@core/store/session/session.store';

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

    expect(labels()).toEqual(['Search', 'Sign out']);
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

    expect(labels()).toEqual(['Search', 'Parent space', 'Sign out']);
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
