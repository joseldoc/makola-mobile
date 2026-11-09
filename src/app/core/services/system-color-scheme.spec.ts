import { TestBed } from '@angular/core/testing';

import { SystemColorScheme } from './system-color-scheme';

/** A media query list whose answer the test changes, as the phone would. */
function fakeQuery(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  return {
    query: {
      matches,
      addEventListener: (_: string, l: (event: MediaQueryListEvent) => void) => listeners.add(l),
      removeEventListener: (_: string, l: (event: MediaQueryListEvent) => void) =>
        listeners.delete(l),
    },
    change(dark: boolean) {
      for (const l of listeners) l({ matches: dark } as MediaQueryListEvent);
    },
    listeners,
  };
}

describe('SystemColorScheme', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the phone’s setting through prefers-color-scheme', () => {
    const fake = fakeQuery(true);
    const matchMedia = vi.fn().mockReturnValue(fake.query);
    vi.stubGlobal('matchMedia', matchMedia);

    const scheme = TestBed.inject(SystemColorScheme);

    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(scheme.prefersDark()).toBe(true);
  });

  it('follows a change made while the app is open, and stops listening when destroyed', () => {
    const fake = fakeQuery(false);
    vi.stubGlobal('matchMedia', () => fake.query);
    const scheme = TestBed.inject(SystemColorScheme);

    fake.change(true);
    expect(scheme.prefersDark()).toBe(true);
    fake.change(false);
    expect(scheme.prefersDark()).toBe(false);

    TestBed.resetTestingModule();
    expect(fake.listeners.size).toBe(0);
  });

  it('without matchMedia, reads the phone as light', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(TestBed.inject(SystemColorScheme).prefersDark()).toBe(false);
  });
});
