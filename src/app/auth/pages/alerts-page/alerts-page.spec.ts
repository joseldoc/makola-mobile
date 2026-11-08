import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { provideI18n } from '@core/i18n';
import { AuthApi } from '@core/services/auth-api';
import { LanguageStore } from '@core/store/language/language.store';

import { AuthFlowStore } from '../../state/auth.store';
import { AlertsPageComponent } from './alerts-page';

describe('AlertsPageComponent — the pass mark alert states its rule (RM-16)', () => {
  let fixture: ComponentFixture<AlertsPageComponent>;

  const row = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.row'))[1];
  const part = (name: string) =>
    row().querySelector(`.${name}`)!.textContent!.replace(/ /g, ' ').trim();

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideI18n(),
        AuthFlowStore,
        { provide: AuthApi, useValue: {} },
      ],
    });
    fixture = TestBed.createComponent(AlertsPageComponent);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('no « 10 » in the label: the pass mark of each scale in the detail (en)', () => {
    expect(part('row-title')).toBe('Grade below the pass mark');
    expect(part('row-detail')).toBe('Half the scale: 10 out of 20, 5 out of 10, 2.5 out of 5.');
  });

  it('fr: « moyenne de passage », the decimal in the interface language', async () => {
    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();

    expect(part('row-title')).toBe('Note sous la moyenne de passage');
    expect(part('row-detail')).toBe('La moitié du barème : 10 sur 20, 5 sur 10, 2,5 sur 5.');
  });
});
