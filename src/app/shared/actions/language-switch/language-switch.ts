import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Language, LANGUAGES } from '@core/i18n/language';

/** Each language is named in itself: a French speaker must find « Français » in an English UI. */
const NATIVE_NAMES: Record<Language, { short: string; name: string }> = {
  en: { short: 'EN', name: 'English' },
  fr: { short: 'FR', name: 'Français' }
};

/**
 * Language pill — two segments on a white surface (text never sits on a role
 * tint). Presentation only: the container calls `LanguageStore.setLanguage`.
 */
@Component({
  selector: 'app-language-switch',
  imports: [TranslocoPipe],
  template: `
    <div class="switch" role="radiogroup" [attr.aria-label]="'language.label' | transloco">
      @for (lang of languages; track lang) {
        <button
          type="button"
          class="option"
          role="radio"
          [class.active]="lang === value()"
          [attr.aria-checked]="lang === value()"
          [attr.aria-label]="names[lang].name"
          [attr.lang]="lang"
          (click)="lang !== value() && valueChange.emit(lang)"
        >
          {{ names[lang].short }}
        </button>
      }
    </div>
  `,
  styleUrl: './language-switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSwitchComponent {
  readonly value = input.required<Language>();
  readonly valueChange = output<Language>();

  protected readonly languages = LANGUAGES;
  protected readonly names = NATIVE_NAMES;
}
