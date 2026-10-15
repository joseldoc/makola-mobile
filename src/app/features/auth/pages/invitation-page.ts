import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { injectTranslate } from '@core/i18n/translate';
import { KeypadComponent } from '@core/shared/components/forms/keypad/keypad';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { AuthBannerComponent, CodeSlotsComponent, CodeSlotsState } from '../components';
import { AuthFlowStore } from '../auth.store';

const LENGTH = 6;

/**
 * Parent entry container: the 6-digit invitation code received from the teacher
 * (RM-12 — single use, 7 days). The parent does not create an account alone:
 * the code links them to one specific student.
 */
@Component({
  selector: 'app-invitation-page',
  imports: [AuthBannerComponent, KeypadComponent, FooterActionComponent, CodeSlotsComponent, TranslocoPipe],
  templateUrl: './invitation-page.html',
  styleUrls: ['./auth-page.scss'],
  host: { '(document:keydown)': 'onKey($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitationPageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();

  protected readonly code = signal('');
  protected readonly state = computed<CodeSlotsState>(() => {
    if (this.store.busy()) return 'checking';
    return this.store.error() ? 'error' : 'idle';
  });
  protected readonly missing = computed(() => {
    if (this.store.busy()) return this.t('auth.invitation.searching');
    const left = LENGTH - this.code().length;
    if (left === LENGTH) return this.t('auth.code.missing');
    return left > 0 ? this.t('auth.identifier.digitsLeft', { count: left }) : '';
  });

  constructor() {
    // A declined child (next screen) comes back here with its message: keep it.
    if (!this.store.error()) this.store.start('invitation');
  }

  protected digit(d: string): void {
    if (this.store.busy() || this.code().length >= LENGTH) return;
    this.store.clearError();
    this.code.update((v) => v + d);
    if (this.code().length === LENGTH) void this.check();
  }

  protected erase(): void {
    if (!this.store.busy()) this.code.update((v) => v.slice(0, -1));
  }

  protected confirm(): void {
    if (this.code().length === LENGTH) void this.check();
  }

  protected onKey(event: KeyboardEvent): void {
    if (/^\d$/.test(event.key)) this.digit(event.key);
    else if (event.key === 'Backspace') this.erase();
  }

  protected goBack(): void {
    void this.router.navigateByUrl('/auth');
  }

  private async check(): Promise<void> {
    if (await this.store.checkInvitation(this.code())) {
      void this.router.navigateByUrl('/auth/invitation/child');
    } else {
      this.code.set('');
    }
  }
}
