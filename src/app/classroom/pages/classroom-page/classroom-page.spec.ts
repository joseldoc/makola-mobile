import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { provideI18n } from '@core/i18n';

import { ClassroomPageComponent } from './classroom-page';

describe('ClassroomPageComponent — assignment rows', () => {
  let fixture: ComponentFixture<ClassroomPageComponent>;

  const rows = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('app-list-row'));

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
