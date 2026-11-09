import { TestBed } from '@angular/core/testing';

import { provideI18n } from '@core/i18n';
import { Appearance } from '@core/models/appearance';
import { LanguageStore } from '@core/store/language/language.store';

import { AppearanceSwitchComponent } from './appearance-switch';

describe('AppearanceSwitchComponent', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  async function setup(value: Appearance) {
    TestBed.configureTestingModule({ providers: [provideI18n()] });
    const fixture = TestBed.createComponent(AppearanceSwitchComponent);
    fixture.componentRef.setInput('value', value);
    const events: Appearance[] = [];
    fixture.componentInstance.valueChange.subscribe((a) => events.push(a));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const options = () => Array.from(element.querySelectorAll<HTMLButtonElement>('button'));
    return { fixture, element, events, options };
  }

  it('offers System, Light, Dark — the phone’s setting first, the default', async () => {
    const { element, options } = await setup('system');

    expect(options().map((o) => o.textContent!.trim())).toEqual(['System', 'Light', 'Dark']);
    expect(element.querySelector('[role="radiogroup"]')!.getAttribute('aria-label')).toBe(
      'Appearance',
    );
    expect(options().map((o) => o.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
  });

  it('emits the appearance picked — never the one already shown', async () => {
    const { events, options } = await setup('light');

    options()[2].click();
    options()[1].click();
    options()[0].click();

    expect(events).toEqual(['dark', 'system']);
  });

  it('every option is a button', async () => {
    const { options } = await setup('dark');

    for (const option of options()) expect(option.getAttribute('type')).toBe('button');
  });

  it('speaks French', async () => {
    const { fixture, options } = await setup('dark');

    await TestBed.inject(LanguageStore).setLanguage('fr');
    await fixture.whenStable();

    expect(options().map((o) => o.textContent!.trim())).toEqual(['Système', 'Clair', 'Sombre']);
  });
});
