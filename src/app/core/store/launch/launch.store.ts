import { inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { patchState, signalStore, withHooks, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, pipe, switchMap, take, tap } from 'rxjs';

/**
 * Native launch screen (the @makola mark on primary blue). `launchAutoHide` is
 * off (capacitor.config.ts): it is removed at the end of the first navigation,
 * when the first Angular screen is ready — never a white screen in between,
 * even on a slow device. On the web, `hide()` does nothing.
 */
export const LaunchStore = signalStore(
  { providedIn: 'root' },
  withState({ ready: false }),
  withHooks((store, router = inject(Router)) => {
    const onFirstNavigation = rxMethod<void>(
      pipe(
        switchMap(() =>
          router.events.pipe(
            filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
            take(1)
          )
        ),
        tap(() => {
          patchState(store, { ready: true });
          void SplashScreen.hide();
        })
      )
    );
    return {
      onInit: () => onFirstNavigation()
    };
  })
);
