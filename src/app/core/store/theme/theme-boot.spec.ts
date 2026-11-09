import { APPEARANCE_KEY, DARK_THEME_VALUE, THEME_ATTRIBUTE } from '@core/models/appearance';

/**
 * `public/theme-boot.js` sets the theme before the first paint, without the app:
 * run as the page runs it, it must decide as ThemeStore does, from the same key.
 */
/**
 * The file as served, read from disk. The tests run in Node, but the project has
 * no Node typings (`@types/node`): the module name is a variable, so that neither
 * TypeScript nor the bundler resolve it — Node does, at run time.
 */
async function readBootScript(): Promise<string> {
  const fs = 'node:fs';
  const { readFileSync } = (await import(/* @vite-ignore */ fs)) as {
    readFileSync(path: string, encoding: 'utf8'): string;
  };
  const cwd = (globalThis as unknown as { process: { cwd(): string } }).process.cwd();
  return readFileSync(`${cwd}/public/theme-boot.js`, 'utf8');
}

describe('theme-boot.js — the theme before the first paint', () => {
  let source = '';
  const root = document.documentElement;

  beforeAll(async () => {
    source = await readBootScript();
  });

  function boot(saved: string | null, phoneDark: boolean | undefined): string | null {
    localStorage.clear();
    if (saved !== null) localStorage.setItem(APPEARANCE_KEY, saved);
    vi.stubGlobal(
      'matchMedia',
      phoneDark === undefined
        ? undefined
        : (query: string) => ({ matches: query === '(prefers-color-scheme: dark)' && phoneDark }),
    );
    root.removeAttribute(THEME_ATTRIBUTE);
    new Function(source)();
    return root.getAttribute(THEME_ATTRIBUTE);
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    root.removeAttribute(THEME_ATTRIBUTE);
  });

  it('follows the phone without a choice, or with « system »', () => {
    expect(boot(null, true)).toBe(DARK_THEME_VALUE);
    expect(boot(null, false)).toBeNull();
    expect(boot('system', true)).toBe(DARK_THEME_VALUE);
  });

  it('a choice wins over the phone', () => {
    expect(boot('dark', false)).toBe(DARK_THEME_VALUE);
    expect(boot('light', true)).toBeNull();
  });

  it('an unknown value is « system », as in ThemeStore', () => {
    expect(boot('sepia', true)).toBe(DARK_THEME_VALUE);
  });

  it('without matchMedia, light unless chosen dark', () => {
    expect(boot(null, undefined)).toBeNull();
    expect(boot('dark', undefined)).toBe(DARK_THEME_VALUE);
  });

  it('reads the key and sets the attribute that the app uses', () => {
    expect(source).toContain(`'${APPEARANCE_KEY}'`);
    expect(source).toContain(`'${THEME_ATTRIBUTE}', '${DARK_THEME_VALUE}'`);
  });
});
