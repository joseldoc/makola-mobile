import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Theme } from '@core/models/appearance';
import { StatusBarService } from '@core/services/status-bar.service';
import { SystemColorScheme } from '@core/services/system-color-scheme';

import { ThemeStore } from './theme.store';

describe('ThemeStore', () => {
  const root = document.documentElement;
  let phoneDark: ReturnType<typeof signal<boolean>>;
  let statusBar: { setTheme: ReturnType<typeof vi.fn> };

  function setup(saved?: string) {
    if (saved !== undefined) localStorage.setItem('mk.appearance', saved);
    TestBed.configureTestingModule({
      providers: [
        { provide: SystemColorScheme, useValue: { prefersDark: phoneDark.asReadonly() } },
        { provide: StatusBarService, useValue: statusBar },
      ],
    });
    const store = TestBed.inject(ThemeStore);
    TestBed.tick();
    return store;
  }

  beforeEach(() => {
    localStorage.clear();
    root.removeAttribute('data-mk-theme');
    root.removeAttribute('data-mk-theme-switching');
    phoneDark = signal(false);
    statusBar = { setTheme: vi.fn<(theme: Theme) => Promise<void>>().mockResolvedValue(undefined) };
  });

  afterEach(() => {
    localStorage.clear();
    root.removeAttribute('data-mk-theme');
    root.removeAttribute('data-mk-theme-switching');
  });

  it('follows the phone by default: « system », light on a light phone', () => {
    const store = setup();

    expect(store.appearance()).toBe('system');
    expect(store.theme()).toBe('light');
    expect(root.hasAttribute('data-mk-theme')).toBe(false);
  });

  it('on a phone set to dark, sets the design system attribute on <html>', () => {
    phoneDark.set(true);
    const store = setup();

    expect(store.theme()).toBe('dark');
    expect(root.getAttribute('data-mk-theme')).toBe('sombre');
  });

  it('follows a change of the phone’s setting while the app is open', () => {
    const store = setup();

    phoneDark.set(true);
    TestBed.tick();
    expect(store.theme()).toBe('dark');
    expect(root.getAttribute('data-mk-theme')).toBe('sombre');

    phoneDark.set(false);
    TestBed.tick();
    expect(store.theme()).toBe('light');
    expect(root.hasAttribute('data-mk-theme')).toBe(false);
  });

  it('a choice wins over the phone, and is kept on the device', () => {
    phoneDark.set(true);
    const store = setup();

    store.setAppearance('light');
    TestBed.tick();
    expect(store.theme()).toBe('light');
    expect(root.hasAttribute('data-mk-theme')).toBe(false);
    expect(localStorage.getItem('mk.appearance')).toBe('light');

    // The phone changing does not override the choice.
    phoneDark.set(false);
    store.setAppearance('dark');
    TestBed.tick();
    expect(root.getAttribute('data-mk-theme')).toBe('sombre');
    expect(localStorage.getItem('mk.appearance')).toBe('dark');
  });

  it('reads the saved choice at start — and ignores a value it does not know', () => {
    expect(setup('dark').theme()).toBe('dark');

    TestBed.resetTestingModule();
    localStorage.clear();
    expect(setup('sepia').appearance()).toBe('system');
  });

  it('back to « system », the phone decides again', () => {
    const store = setup('dark');

    store.setAppearance('system');
    TestBed.tick();

    expect(store.theme()).toBe('light');
    expect(localStorage.getItem('mk.appearance')).toBe('system');
  });

  it('gives each theme shown to the status bar, once per change', () => {
    const store = setup();
    store.setAppearance('dark');
    TestBed.tick();
    store.setAppearance('dark');
    TestBed.tick();

    expect(statusBar.setTheme.mock.calls).toEqual([['light'], ['dark']]);
  });

  it('a change while the app is open suspends transitions until it is painted', async () => {
    const store = setup();
    // The first theme is not a change: nothing to suspend.
    expect(root.hasAttribute('data-mk-theme-switching')).toBe(false);

    store.setAppearance('dark');
    TestBed.tick();
    expect(root.hasAttribute('data-mk-theme-switching')).toBe(true);

    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    await new Promise((done) => requestAnimationFrame(done));
    expect(root.hasAttribute('data-mk-theme-switching')).toBe(false);
  });
});
