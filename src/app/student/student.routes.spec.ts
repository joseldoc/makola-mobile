import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { provideI18n } from '@core/i18n';
import { Session } from '@core/models/auth.model';
import { SessionStore } from '@core/store/session/session.store';

import { routes } from '../app.routes';
import { StudentPageComponent } from './pages/student-page/student-page';
import { MockStudentRecordApi } from './services/mock-student-record-api';
import { StudentRecordApi } from './services/student-record-api';

const identifier = { channel: 'phone', value: '+242066123456' } as const;
const clean = (text: string | null | undefined) => (text ?? '').replace(/ /g, ' ').trim();

/** Launches the app on this stored session, with the real routes. */
async function launch(session: Session): Promise<RouterTestingHarness> {
  localStorage.clear();
  localStorage.setItem('mk.onboarding-seen', 'true');
  localStorage.setItem('mk.session', JSON.stringify(session));
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      provideI18n(),
      { provide: StudentRecordApi, useClass: MockStudentRecordApi },
    ],
  });
  return RouterTestingHarness.create();
}

describe('Student page routes — one page, two spaces (US-P08)', () => {
  afterEach(() => localStorage.clear());

  it('a teacher opens a student of the class from the address', async () => {
    const harness = await launch({
      id: 'a1',
      identifier,
      name: 'NKOUKA Joseph',
      activeRole: 'teacher',
      roles: { teacher: 'ready' },
    });
    await harness.navigateByUrl('/student/l1-maths/kimbembe-sarah', StudentPageComponent);
    await harness.fixture.whenStable();

    const el = harness.routeNativeElement!;
    expect(clean(el.querySelector('app-bar .title')?.textContent)).toBe('KIMBEMBE Sarah');
    expect(clean(el.querySelector('app-bar .subtitle')?.textContent)).toBe(
      'L1 Mathématiques · Analyse · Semester 2',
    );
  });

  it('a parent opens their child, in the subject of the teacher who invited them (A-19)', async () => {
    const harness = await launch({
      id: 'p1',
      identifier,
      activeRole: 'parent',
      roles: { parent: 'ready' },
    });
    await harness.navigateByUrl('/student/child', StudentPageComponent);
    await harness.fixture.whenStable();

    const el = harness.routeNativeElement!;
    expect(clean(el.querySelector('app-bar .title')?.textContent)).toBe('ILUNGA Marie');
    // One subject: the bar names it, and every assignment is of that class and subject.
    expect(clean(el.querySelector('app-bar .subtitle')?.textContent)).toBe(
      '4ème B · Maths · Term 2',
    );
    expect(el.querySelectorAll('app-list-row')).toHaveLength(8);
  });

  it('a parent-only account cannot open a student by address', async () => {
    const harness = await launch({
      id: 'p1',
      identifier,
      activeRole: 'parent',
      roles: { parent: 'ready' },
    });
    await harness.navigateByUrl('/student/4b-maths/samba-rose');

    expect(TestBed.inject(Router).url).not.toContain('/student/');
    expect(TestBed.inject(SessionStore).activeRole()).toBe('parent');
  });
});
