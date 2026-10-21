import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

/** Interpolation parameters of a translation. */
export type TranslationParams = Record<string, unknown>;

import { LanguageStore } from '@core/store/language/language.store';

/** A translatable message: a key and its parameters, translated in the template. */
export interface Message {
  key: string;
  params?: TranslationParams;
}

/**
 * Translation function for text built in TypeScript (inputs, computed labels).
 * Reading it inside a `computed()` makes the result follow language changes.
 * Templates use the `transloco` pipe instead.
 */
export function injectTranslate(): (key: string, params?: TranslationParams) => string {
  const transloco = inject(TranslocoService);
  const language = inject(LanguageStore);
  return (key, params) => {
    language.language();
    return transloco.translate(key, params);
  };
}
