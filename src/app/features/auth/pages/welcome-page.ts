import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { Intent } from '@core/auth/auth.model';
import { Language } from '@core/i18n/language';
import { LanguageStore } from '@core/store/language/language.store';
import { LogoComponent } from '@core/shared/components/brand/logo/logo';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';
import { LanguageSwitchComponent } from '@core/shared/components/actions/language-switch/language-switch';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';

import { AuthFlowStore } from '../auth.store';

const INTENT_ROUTES: Record<Intent, string> = {
  'sign-up': '/auth/sign-up',
  'sign-in': '/auth/sign-in',
  invitation: '/auth/invitation'
};

/**
 * Welcome — the light entry surface of the mock-up (24a): the mark, the promise,
 * three doors. The teacher signs up or signs in; the parent has no account to
 * create alone: they enter with the code received from the teacher (RM-12).
 */
@Component({
  selector: 'app-welcome-page',
  imports: [LogoComponent, FooterActionComponent, OutlinedButtonComponent, LanguageSwitchComponent, TranslocoPipe],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomePageComponent {
  protected readonly language = inject(LanguageStore);
  private readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);

  protected open(intent: Intent): void {
    this.store.start(intent);
    void this.router.navigateByUrl(INTENT_ROUTES[intent]);
  }

  protected setLanguage(language: Language): void {
    void this.language.setLanguage(language);
  }
}
