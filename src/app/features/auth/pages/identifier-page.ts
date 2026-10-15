import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, form, submit, validate } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';

import { Channel, Intent } from '@core/auth/auth.model';
import { emailIdentifier, phoneIdentifier } from '@core/auth/identifier';
import { COUNTRIES, CountryCode, DEFAULT_COUNTRY, countryByCode } from '@core/auth/country';
import { injectTranslate } from '@core/i18n/translate';
import { TextFieldComponent } from '@core/shared/components/forms/text-field/text-field';
import { KeypadComponent } from '@core/shared/components/forms/keypad/keypad';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { AuthBannerComponent, CountrySheetComponent, PhoneFieldComponent } from '../components';
import { AuthFlowStore } from '../auth.store';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * "Identifier" step container (@makola mock-up 24c). Phone by default, typed on
 * the dedicated keypad; email stays possible (US-P01) with the system keyboard.
 * Signal form; the server's refusal shows under the field.
 */
@Component({
  selector: 'app-identifier-page',
  imports: [
    AuthBannerComponent,
    PhoneFieldComponent,
    CountrySheetComponent,
    TextFieldComponent,
    KeypadComponent,
    FooterActionComponent,
    FormField,
    TranslocoPipe
  ],
  templateUrl: './identifier-page.html',
  styleUrls: ['./auth-page.scss'],
  host: { '(document:keydown)': 'onKey($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentifierPageComponent implements OnInit {
  /** Provided by the route (`data`). */
  readonly intent = input.required<Intent>();

  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();

  protected readonly channel = signal<Channel>('phone');
  /** The calling code sets the account's country — never asked again in the profile. */
  protected readonly countries = COUNTRIES;
  protected readonly countryCode = signal<CountryCode>(DEFAULT_COUNTRY);
  protected readonly country = computed(() => countryByCode(this.countryCode()));
  protected readonly choosingCountry = signal(false);

  /** Translation root of the banner: `auth.identifier.<intent>.<channel>`. */
  protected readonly textsKey = computed(() => `auth.identifier.${this.intent()}.${this.channel()}`);
  protected readonly role = computed(() => (this.intent() === 'invitation' ? 'parent' : 'school'));

  private readonly model = signal({ value: '' });
  protected readonly form = form(this.model, (p) => {
    validate(p.value, ({ value }) => {
      const v = value().trim();
      if (this.channel() === 'phone') {
        const country = this.country();
        if (!v) return { kind: 'required', message: this.t('auth.identifier.phoneRequired') };
        if (v.length < country.length) return { kind: 'incomplete', message: '' };
        if (!country.mobile.test(v)) {
          return {
            kind: 'format',
            message: this.t('auth.identifier.phoneFormat', { code: country.callingCode, prefixes: country.prefixes })
          };
        }
        return null;
      }
      if (!v) return { kind: 'required', message: this.t('auth.identifier.emailRequired') };
      if (!EMAIL.test(v)) return { kind: 'format', message: this.t('auth.identifier.emailFormat') };
      return null;
    });
  });

  protected readonly digits = computed(() => this.model().value);

  /** Hint under the phone field: progress, then the refusal if there is one. */
  protected readonly hint = computed(() => {
    const serverError = this.store.errorMessage();
    if (serverError) return this.t(serverError.key, serverError.params);
    const error = this.form.value().errors()[0];
    if (error?.kind === 'format') return error.message ?? '';
    const length = this.country().length;
    const n = this.digits().length;
    if (n === length) return this.t('auth.identifier.phoneComplete');
    return this.t('auth.identifier.phoneProgress', { count: n, total: length });
  });
  protected readonly hintIsError = computed(
    () => !!this.store.error() || this.form.value().errors()[0]?.kind === 'format'
  );

  /** The button says what is missing — never a greyed-out "Get the code". */
  protected readonly missing = computed(() => {
    if (this.store.busy()) return this.t('auth.identifier.sending');
    const error = this.form.value().errors()[0];
    if (!error) return '';
    if (this.channel() === 'phone') {
      const left = this.country().length - this.digits().length;
      if (error.kind === 'required') return this.t('auth.identifier.missingPhone');
      if (error.kind === 'incomplete') return this.t('auth.identifier.digitsLeft', { count: left });
      return this.t('auth.identifier.fixPhone');
    }
    return this.t(error.kind === 'required' ? 'auth.identifier.missingEmail' : 'auth.identifier.fixEmail');
  });

  constructor() {
    // Any new input clears the server's previous refusal.
    effect(() => {
      this.model();
      untracked(() => this.store.clearError());
    });
  }

  ngOnInit(): void {
    this.store.start(this.intent());
  }

  protected digit(d: string): void {
    if (this.channel() !== 'phone' || this.store.busy()) return;
    const length = this.country().length;
    this.form.value().value.update((v) => (v.length < length ? v + d : v));
  }

  protected erase(): void {
    if (this.channel() !== 'phone' || this.store.busy()) return;
    this.form.value().value.update((v) => v.slice(0, -1));
  }

  protected chooseCountry(code: CountryCode): void {
    this.countryCode.set(code);
    this.choosingCountry.set(false);
    // Lengths differ from one country to another: keep what fits.
    const length = this.country().length;
    this.form.value().value.update((v) => v.slice(0, length));
  }

  protected switchChannel(): void {
    this.channel.update((c) => (c === 'phone' ? 'email' : 'phone'));
    this.form().reset({ value: '' });
  }

  /** Physical keyboard (web, tablet with keyboard) for the number. */
  protected onKey(event: KeyboardEvent): void {
    if (this.channel() !== 'phone' || this.choosingCountry()) return;
    if (/^\d$/.test(event.key)) this.digit(event.key);
    else if (event.key === 'Backspace') this.erase();
    else if (event.key === 'Enter') this.send();
  }

  protected send(event?: Event): void {
    event?.preventDefault();
    void submit(this.form, async () => {
      const value = this.model().value;
      const identifier = this.channel() === 'phone' ? phoneIdentifier(this.country(), value) : emailIdentifier(value);
      if (await this.store.requestCode(identifier)) {
        void this.router.navigateByUrl('/auth/code');
      }
      return undefined;
    });
  }

  protected goBack(): void {
    void this.router.navigateByUrl(this.intent() === 'invitation' ? '/auth/invitation/child' : '/auth');
  }
}
