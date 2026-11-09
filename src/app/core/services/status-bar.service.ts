import { ErrorHandler, Service, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

import { Theme } from '@core/models/appearance';

/**
 * Native status bar — the only place that imports `@capacitor/status-bar`.
 *
 * The WebView runs under the status bar (`overlaysWebView: true`,
 * capacitor.config.ts; edge-to-edge is enforced on Android 15+): its background
 * is the app bar's, already in the theme. Only the colour of its icons follows
 * the theme — dark on the light role tints, light on the dark elevation.
 * `setBackgroundColor` would do nothing in this configuration, so it is not called.
 * The web has no status bar: `setTheme()` does nothing there.
 */
@Service()
export class StatusBarService {
  private readonly errorHandler = inject(ErrorHandler);

  async setTheme(theme: Theme): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // Capacitor's names describe the background: `Light` = dark icons.
      await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
    } catch (error) {
      // Icons left in the wrong colour must be seen: Angular's ErrorHandler, as
      // for the launch screen (SplashScreenService). The theme itself is applied.
      this.errorHandler.handleError(error);
    }
  }
}
