import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { form, submit, validate } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';

import { PARENTAL_CONSENTS, ParentalConsent } from '@core/models/auth.model';
import { injectTranslate } from '@core/i18n/translate';
import { AppBarComponent } from '@shared/navigation/app-bar/app-bar';
import { CheckboxComponent } from '@shared/forms/checkbox/checkbox';
import { FooterActionComponent } from '@shared/actions/footer-action/footer-action';
import { OutlinedButtonComponent } from '@shared/actions/outlined-button/outlined-button';

import { AuthFlowStore } from '../../state/auth.store';

/**
 * Parental consents container (RI-20), between the parent's number and the code:
 * shown only when the server asks for some — Kenya, for the parent's country or
 * the inviting teacher's. One box per document, none ticked beforehand: the
 * consent is explicit. Without them, no link: the parent can turn the invitation
 * down here, and no SMS has left yet.
 *
 * The button is never greyed out (§7.6): until every box is ticked it says how
 * many are left, and a press brings the first unticked box into focus.
 */
@Component({
  selector: 'app-consents-page',
  imports: [
    AppBarComponent,
    CheckboxComponent,
    FooterActionComponent,
    OutlinedButtonComponent,
    TranslocoPipe,
  ],
  templateUrl: './consents-page.html',
  styleUrls: ['../auth-page.scss', './consents-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentsPageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();
  private readonly boxes = viewChildren(CheckboxComponent, { read: ElementRef });

  protected readonly scrolled = signal(false);

  /** The documents the server asks for, in display order. */
  protected readonly consents = computed(() => {
    const required = this.store.requiredConsents() ?? [];
    return PARENTAL_CONSENTS.filter((consent) => required.includes(consent));
  });

  /** Nothing ticked beforehand: a consent is given, never presumed. */
  private readonly model = signal<Record<ParentalConsent, boolean>>({
    CHILD_DATA: false,
    CROSS_BORDER_TRANSFER: false,
  });
  protected readonly form = form(this.model, (p) => {
    for (const consent of PARENTAL_CONSENTS) {
      validate(p[consent], ({ value }) =>
        this.consents().includes(consent) && !value() ? { kind: 'consentMissing' } : null,
      );
    }
  });

  /** « KAMAU Wanjiru » → « Wanjiru »: the first name is enough in a sentence. */
  protected readonly firstName = computed(() => {
    const name = this.store.invitation()?.student ?? '';
    return name.split(' ').slice(1).join(' ') || name;
  });

  private readonly unticked = computed(() =>
    this.consents().filter((consent) => this.form[consent]().invalid()),
  );

  /** The button says what is left to do — never a greyed-out "Continue". */
  protected readonly action = computed(() => {
    if (this.store.busy()) return this.t('auth.identifier.sending');
    const left = this.unticked().length;
    return left ? this.t('auth.consents.left', { count: left }) : this.t('auth.identifier.getCode');
  });

  protected tick(consent: ParentalConsent, checked: boolean): void {
    this.store.clearError();
    this.form[consent]().value.set(checked);
  }

  protected onScroll(event: Event): void {
    this.scrolled.set((event.currentTarget as HTMLElement).scrollTop > 0);
  }

  protected send(): void {
    void submit(this.form, {
      action: async () => {
        if (await this.store.giveConsents(this.consents())) {
          void this.router.navigateByUrl('/auth/code');
        }
        return undefined;
      },
      onInvalid: () => this.focusFirstUnticked(),
    });
  }

  /** Without consent, no link (RI-20): back to the invitation code, with what the parent can do. */
  protected decline(): void {
    this.store.declineInvitation('consents-declined');
    void this.router.navigateByUrl('/auth/invitation');
  }

  protected goBack(): void {
    void this.router.navigateByUrl('/auth/invitation/phone');
  }

  private focusFirstUnticked(): void {
    const index = this.consents().indexOf(this.unticked()[0]);
    const box = this.boxes()[index]?.nativeElement as HTMLElement | undefined;
    box?.querySelector<HTMLElement>('[role="checkbox"]')?.focus();
  }
}
