import { ErrorHandler, Service, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Native launch screen (the @makola mark on primary blue) — the only place that
 * imports `@capacitor/splash-screen`. `launchAutoHide` is off
 * (capacitor.config.ts): `LaunchStore` asks for it to be hidden once the first
 * screen is ready. The web has no launch screen: `hide()` does nothing there.
 */
@Service()
export class SplashScreenService {
  private readonly errorHandler = inject(ErrorHandler);

  async hide(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await SplashScreen.hide();
    } catch (error) {
      // With `launchAutoHide` off, a failed hide leaves the launch screen over
      // the app: the failure must be seen. It goes to Angular's ErrorHandler (as
      // the unhandled rejection did before this service), and is caught here so
      // that the rest of the launch carries on.
      this.errorHandler.handleError(error);
    }
  }
}
