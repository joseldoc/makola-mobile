import { computed, effect, inject, provideAppInitializer } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';

import {
  APPEARANCE_KEY,
  Appearance,
  DARK_THEME_VALUE,
  DEFAULT_APPEARANCE,
  THEME_ATTRIBUTE,
  Theme,
  isAppearance,
  themeOf,
} from '@core/models/appearance';
import { StatusBarService } from '@core/services/status-bar.service';
import { SystemColorScheme } from '@core/services/system-color-scheme';

/**
 * Appearance of the app (dark mode, 9 November 2026) — on the model of
 * `LanguageStore`: the user's choice is remembered on the device (Web Storage,
 * nothing sensitive), « system » by default, which follows the phone's setting,
 * live. The theme shown is derived; an effect sets it on <html>
 * (`data-mk-theme="sombre"`, the design system's dark derivation) and on the
 * native status bar.
 *
 * `public/theme-boot.js` sets the same attribute before the first paint, from the
 * same key: this store takes over from there.
 */
export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState(() => ({ appearance: readAppearance() })),
  withComputed((store, system = inject(SystemColorScheme)) => ({
    /** The theme shown: a choice, or the phone's setting. */
    theme: computed<Theme>(() => themeOf(store.appearance(), system.prefersDark())),
  })),
  withMethods((store) => ({
    setAppearance(appearance: Appearance): void {
      if (appearance === store.appearance()) return;
      patchState(store, { appearance });
      try {
        localStorage.setItem(APPEARANCE_KEY, appearance);
      } catch {
        // Storage unavailable: the choice holds for this session.
      }
    },
  })),
  withHooks((store, statusBar = inject(StatusBarService)) => ({
    onInit() {
      let shown: Theme | null = null;
      effect(() => {
        const theme = store.theme();
        // A change while the app is open is instant: without this, a list row would
        // cross the 420 ms of its confirmation flash from white to ink.
        applyTheme(document.documentElement, theme, shown !== null && shown !== theme);
        shown = theme;
        void statusBar.setTheme(theme);
      });
    },
  })),
);

/** Created with the app: the theme follows from the first screen, not from the first visit of a setting. */
export function provideTheme() {
  return provideAppInitializer(() => void inject(ThemeStore));
}

function applyTheme(root: HTMLElement, theme: Theme, instant: boolean): void {
  if (instant) {
    // styles.scss: no transition under this attribute — removed once the new
    // colours have been painted.
    root.setAttribute(SWITCHING_ATTRIBUTE, '');
    afterNextPaint(() => root.removeAttribute(SWITCHING_ATTRIBUTE));
  }
  if (theme === 'dark') root.setAttribute(THEME_ATTRIBUTE, DARK_THEME_VALUE);
  else root.removeAttribute(THEME_ATTRIBUTE);
}

const SWITCHING_ATTRIBUTE = 'data-mk-theme-switching';

function afterNextPaint(callback: () => void): void {
  if (typeof requestAnimationFrame !== 'function') return callback();
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

function readAppearance(): Appearance {
  try {
    const saved = localStorage.getItem(APPEARANCE_KEY);
    return isAppearance(saved) ? saved : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}
