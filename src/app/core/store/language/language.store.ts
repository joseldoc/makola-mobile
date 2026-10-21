import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { DEFAULT_LANGUAGE, Language, LANGUAGES } from '@core/i18n/language';

const LANGUAGE_KEY = 'mk.language';

/**
 * Interface language — English by default, the user's choice is remembered on
 * the device (Web Storage: no native API is needed here). The translation file
 * is loaded before switching, so a screen never shows raw keys.
 */
export const LanguageStore = signalStore(
  { providedIn: 'root' },
  withState(() => ({ language: readLanguage() })),
  withMethods((store, transloco = inject(TranslocoService)) => {
    async function apply(language: Language): Promise<void> {
      await firstValueFrom(transloco.load(language));
      transloco.setActiveLang(language);
      document.documentElement.lang = language;
      patchState(store, { language });
    }

    return {
      /** App initializer: activates the saved language before the first render. */
      init(): Promise<void> {
        return apply(store.language());
      },
      async setLanguage(language: Language): Promise<void> {
        if (language === store.language()) return;
        await apply(language);
        try {
          localStorage.setItem(LANGUAGE_KEY, language);
        } catch {
          // Storage unavailable: the choice holds for this session.
        }
      }
    };
  })
);

function readLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY) as Language | null;
    return saved && LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}
