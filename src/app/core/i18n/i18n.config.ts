import { Injectable, isDevMode, provideAppInitializer, inject } from '@angular/core';
import { provideTransloco, Translation, TranslocoLoader } from '@jsverse/transloco';

import { LanguageStore } from '@core/store/language/language.store';

import { DEFAULT_LANGUAGE, Language, LANGUAGES } from './language';

/**
 * Translations are bundled with the app (dynamic `import()`, no HTTP): they work
 * offline and inside the Capacitor WebView from the very first launch.
 */
const TRANSLATIONS: Record<Language, () => Promise<{ default: Translation }>> = {
  en: () => import('../../../i18n/en.json'),
  fr: () => import('../../../i18n/fr.json')
};

@Injectable({ providedIn: 'root' })
export class BundledTranslationLoader implements TranslocoLoader {
  async getTranslation(lang: string): Promise<Translation> {
    const load = TRANSLATIONS[lang as Language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
    return (await load()).default;
  }
}

export function provideI18n() {
  return [
    provideTransloco({
      config: {
        availableLangs: LANGUAGES,
        defaultLang: DEFAULT_LANGUAGE,
        fallbackLang: DEFAULT_LANGUAGE,
        reRenderOnLangChange: true,
        missingHandler: { useFallbackTranslation: true, logMissingKey: isDevMode(), allowEmpty: true },
        prodMode: !isDevMode()
      },
      loader: BundledTranslationLoader
    }),
    // The saved language is loaded before the first screen renders: no flash of keys.
    provideAppInitializer(() => inject(LanguageStore).init())
  ];
}
