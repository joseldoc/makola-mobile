import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { Intent } from '@core/auth/auth.model';
import { formatIdentifier } from '@core/auth/identifier';
import { injectTranslate } from '@core/i18n/translate';
import { SessionStore } from '@core/store/session/session.store';
import { KeypadComponent } from '@core/shared/components/forms/keypad/keypad';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { AuthBannerComponent, CodeSlotsComponent, CodeSlotsState } from '../components';
import { AuthFlowStore } from '../auth.store';

const LENGTH = 6;

const CHANGE_ROUTES: Record<Intent, string> = {
  'sign-up': '/auth/sign-up',
  'sign-in': '/auth/sign-in',
  invitation: '/auth/invitation/phone'
};

/**
 * "Code" step container: 6 digits on the dedicated keypad (the system keyboard
 * does not open), checked as soon as the sixth digit is typed, resend after the
 * anti-spam delay (US-P01). A refusal empties the boxes and says what to do.
 */
@Component({
  selector: 'app-code-page',
  imports: [AuthBannerComponent, KeypadComponent, FooterActionComponent, CodeSlotsComponent, TranslocoPipe],
  templateUrl: './code-page.html',
  styleUrls: ['./auth-page.scss'],
  host: { '(document:keydown)': 'onKey($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodePageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();

  protected readonly code = signal('');
  private readonly now = signal(Date.now());

  protected readonly role = computed(() => (this.store.intent() === 'invitation' ? 'parent' : 'school'));
  protected readonly byEmail = computed(() => this.store.identifier()?.channel === 'email');
  protected readonly step = computed(() => this.t(`auth.code.step.${this.store.intent()}`));
  protected readonly text = computed(() => {
    const id = this.store.identifier();
    return id ? this.t('auth.code.sentTo', { identifier: formatIdentifier(id) }) : '';
  });
  protected readonly state = computed<CodeSlotsState>(() => {
    if (this.store.busy()) return 'checking';
    return this.store.error() ? 'error' : 'idle';
  });
  /** Seconds before a new code can be requested. */
  protected readonly wait = computed(() => Math.max(0, Math.ceil((this.store.resendAllowedAt() - this.now()) / 1000)));
  protected readonly missing = computed(() => {
    if (this.store.busy()) return this.t('auth.code.checking');
    const left = LENGTH - this.code().length;
    if (left === LENGTH) return this.t('auth.code.missing');
    return left > 0 ? this.t('auth.identifier.digitsLeft', { count: left }) : '';
  });

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected digit(d: string): void {
    if (this.store.busy() || this.code().length >= LENGTH) return;
    this.store.clearError();
    this.code.update((v) => v + d);
    if (this.code().length === LENGTH) void this.verify();
  }

  protected erase(): void {
    if (this.store.busy()) return;
    this.code.update((v) => v.slice(0, -1));
  }

  protected enter(): void {
    if (this.code().length === LENGTH) void this.verify();
  }

  protected async resend(): Promise<void> {
    this.code.set('');
    await this.store.resendCode();
  }

  protected change(): void {
    void this.router.navigateByUrl(CHANGE_ROUTES[this.store.intent()]);
  }

  /** Physical keyboard (web, tablet with keyboard): digits and backspace. */
  protected onKey(event: KeyboardEvent): void {
    if (/^\d$/.test(event.key)) this.digit(event.key);
    else if (event.key === 'Backspace') this.erase();
  }

  private async verify(): Promise<void> {
    const session = await this.store.verifyCode(this.code());
    if (session) {
      void this.router.navigateByUrl(this.session.initialRoute(), { replaceUrl: true });
    } else {
      this.code.set('');
    }
  }
}
