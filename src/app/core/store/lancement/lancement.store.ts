import { inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { patchState, signalStore, withHooks, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, pipe, switchMap, take, tap } from 'rxjs';

/**
 * Écran de lancement natif (signe @makola sur le bleu primaire). `launchAutoHide`
 * est désactivé (capacitor.config.ts) : on le retire à la fin de la première
 * navigation, quand le premier écran Angular est prêt — jamais d'écran blanc
 * entre les deux, même sur un terminal lent. Sur le web, `hide()` ne fait rien.
 */
export const LancementStore = signalStore(
  { providedIn: 'root' },
  withState({ pret: false }),
  withHooks((store, router = inject(Router)) => {
    const surPremiereNavigation = rxMethod<void>(
      pipe(
        switchMap(() =>
          router.events.pipe(
            filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
            take(1)
          )
        ),
        tap(() => {
          patchState(store, { pret: true });
          void SplashScreen.hide();
        })
      )
    );
    return {
      onInit: () => surPremiereNavigation()
    };
  })
);
