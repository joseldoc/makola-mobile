import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FieldTree, FormField, form, submit, validate } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';

import { Level, TeacherProfile } from '@core/auth/auth.model';
import { formatIdentifier } from '@core/auth/identifier';
import { COUNTRIES, CountryCode, DEFAULT_COUNTRY, countryByCode, countryOfNumber } from '@core/auth/country';
import { injectTranslate } from '@core/i18n/translate';
import { SessionStore } from '@core/store/session/session.store';
import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { TextFieldComponent } from '@core/shared/components/forms/text-field/text-field';
import { CheckboxComponent } from '@core/shared/components/forms/checkbox/checkbox';
import { RadioButtonComponent } from '@core/shared/components/forms/radio-button/radio-button';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';

import { AuthFlowStore } from '../auth.store';
import { LEVELS, SUBJECTS } from '../model';

/** The three steps — translation roots `auth.profile.steps.<name>`. */
const STEPS = ['identity', 'subjects', 'city'] as const;

/**
 * Teacher profile container, mandatory after the code (US-P01), in three steps:
 * identity, subjects, city. The country comes from the phone number's calling
 * code and is never asked again — except for an email sign-up.
 * A single signal form; each step only validates its own fields.
 */
@Component({
  selector: 'app-profile-page',
  imports: [AppBarComponent, TextFieldComponent, CheckboxComponent, RadioButtonComponent, FooterActionComponent, FormField, TranslocoPipe],
  templateUrl: './profile-page.html',
  styleUrls: ['./auth-page.scss', './profile-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly t = injectTranslate();
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');

  protected readonly subjects = SUBJECTS;
  protected readonly levels = LEVELS;
  protected readonly countries = COUNTRIES;
  protected readonly step = signal(0);
  protected readonly stepKey = computed(() => `auth.profile.steps.${STEPS[this.step()]}`);
  protected readonly last = computed(() => this.step() === STEPS.length - 1);
  protected readonly scrolled = signal(false);

  /** Account phone number → country. Absent for an email sign-up. */
  private readonly identifier = computed(() => this.session.session()?.identifier);
  protected readonly deducedCountry = computed(() => {
    const id = this.identifier();
    return id?.channel === 'phone' ? countryOfNumber(id.value) : undefined;
  });
  protected readonly phoneNumber = computed(() => {
    const id = this.identifier();
    return id ? formatIdentifier(id) : '';
  });

  private readonly model = signal<TeacherProfile>({
    lastName: '',
    firstName: '',
    subjects: [],
    levels: [],
    city: '',
    country: this.deducedCountry()?.code ?? DEFAULT_COUNTRY
  });
  protected readonly form = form(this.model, (p) => {
    validate(p.lastName, ({ value }) =>
      value().trim().length < 2 ? { kind: 'lastName', message: this.t('auth.profile.errors.lastName') } : null
    );
    validate(p.firstName, ({ value }) =>
      value().trim().length < 2 ? { kind: 'firstName', message: this.t('auth.profile.errors.firstName') } : null
    );
    validate(p.subjects, ({ value }) => (value().length ? null : { kind: 'subjects' }));
    validate(p.levels, ({ value }) => (value().length ? null : { kind: 'levels' }));
    validate(p.city, ({ value }) =>
      value().trim().length < 2 ? { kind: 'city', message: this.t('auth.profile.errors.city') } : null
    );
  });

  protected readonly country = computed(() => countryByCode(this.model().country));
  protected readonly selectedCity = computed(() => this.model().city.trim());

  /** « NKOUKA Joseph » — the name as it will appear on class lists. */
  protected readonly preview = computed(() => {
    const { lastName, firstName } = this.model();
    return [lastName.trim().toUpperCase(), firstName.trim()].filter(Boolean).join(' ');
  });

  private readonly fieldsByStep = computed<FieldTree<unknown>[][]>(() => {
    const f = this.form;
    return [[f.lastName, f.firstName], [f.subjects, f.levels], [f.city, f.country]];
  });

  /** What is missing, said on the button. */
  protected readonly missing = computed(() => {
    if (this.store.busy()) return this.t('auth.profile.activating');
    const field = this.fieldsByStep()[this.step()].find((f) => f().invalid());
    const error = field?.().errors()[0];
    return error ? this.t(`auth.profile.missing.${error.kind}`) : '';
  });

  protected hasSubject(value: string): boolean {
    return this.model().subjects.includes(value);
  }

  protected hasLevel(value: Level): boolean {
    return this.model().levels.includes(value);
  }

  protected toggleSubject(value: string): void {
    this.form.subjects().value.update((list) => toggle(list, value));
  }

  protected toggleLevel(value: Level): void {
    this.form.levels().value.update((list) => toggle(list, value));
  }

  protected chooseCity(city: string): void {
    this.form.city().value.set(city);
  }

  protected chooseCountry(code: CountryCode): void {
    this.form.country().value.set(code);
  }

  protected onScroll(event: Event): void {
    this.scrolled.set((event.currentTarget as HTMLElement).scrollTop > 0);
  }

  protected next(event?: Event): void {
    event?.preventDefault();
    if (this.missing()) return;
    if (this.last()) this.activate();
    else this.goTo(this.step() + 1);
  }

  protected previous(): void {
    if (this.step() > 0) this.goTo(this.step() - 1);
  }

  private goTo(step: number): void {
    this.step.set(step);
    this.content().nativeElement.scrollTop = 0;
    this.scrolled.set(false);
  }

  private activate(): void {
    void submit(this.form, async () => {
      const p = this.model();
      const profile = { ...p, lastName: p.lastName.trim(), firstName: p.firstName.trim(), city: p.city.trim() };
      if (await this.store.completeProfile(profile)) {
        void this.router.navigateByUrl('/classroom', { replaceUrl: true });
      }
      return undefined;
    });
  }
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
