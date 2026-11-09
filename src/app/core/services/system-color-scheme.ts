import { DestroyRef, Service, inject, signal } from '@angular/core';

import { DARK_SCHEME_QUERY } from '@core/models/appearance';

/**
 * The phone's light or dark setting (`prefers-color-scheme`), as a signal that
 * follows a change made while the app is open — zoneless: the listener writes a
 * signal, nothing else. The only place that reads this media query.
 *
 * In the Capacitor WebView it follows the system: on Android 13+ the WebView
 * reports the app theme's light/dark state, and the activity theme of the
 * Capacitor template is `DayNight`; on iOS, WKWebView follows the system unless
 * `UIUserInterfaceStyle` is forced in Info.plist. Without `matchMedia` (tests),
 * the phone is read as light.
 */
@Service()
export class SystemColorScheme {
  private readonly query = typeof matchMedia === 'function' ? matchMedia(DARK_SCHEME_QUERY) : null;
  private readonly dark = signal(this.query?.matches ?? false);

  /** `true` while the phone is set to dark. */
  readonly prefersDark = this.dark.asReadonly();

  constructor() {
    const query = this.query;
    if (!query) return;
    const listener = (event: MediaQueryListEvent) => this.dark.set(event.matches);
    query.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', listener));
  }
}
