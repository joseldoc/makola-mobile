import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { Language } from '@core/i18n/language';
import { LanguageStore } from '@core/store/language/language.store';
import { SessionStore } from '@core/store/session/session.store';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';
import { LanguageSwitchComponent } from '@core/shared/components/actions/language-switch/language-switch';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';
import { ProgressDotsComponent } from '@core/shared/components/navigation/progress-dots/progress-dots';

import { OnboardingSlideComponent } from '../components';
import { OnboardingStore } from '../onboarding.store';

/**
 * Onboarding container — 4 screens, native swipe (CSS scroll-snap, no gesture
 * library), dots tappable both ways. Seen once per device; "Skip" and "Start"
 * lead to the welcome screen. The language is chosen here, before anything else.
 */
@Component({
  selector: 'app-onboarding-page',
  imports: [OnboardingSlideComponent, FooterActionComponent, OutlinedButtonComponent, ProgressDotsComponent, LanguageSwitchComponent, TranslocoPipe],
  providers: [OnboardingStore],
  templateUrl: './onboarding-page.html',
  styleUrl: './onboarding-page.scss',
  host: { '(window:resize)': 'realign()' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingPageComponent {
  protected readonly store = inject(OnboardingStore);
  protected readonly language = inject(LanguageStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private frame = 0;

  protected onScroll(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const el = this.track().nativeElement;
      this.store.setIndex(Math.round(el.scrollLeft / el.clientWidth));
    });
  }

  protected goTo(index: number): void {
    const el = this.track().nativeElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: index * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
    this.store.setIndex(index);
  }

  protected next(): void {
    if (this.store.last()) this.finish();
    else this.goTo(this.store.index() + 1);
  }

  protected finish(): void {
    this.session.completeOnboarding();
    void this.router.navigateByUrl('/auth', { replaceUrl: true });
  }

  protected setLanguage(language: Language): void {
    void this.language.setLanguage(language);
  }

  /** Rotation, resize: the current screen stays the one shown. */
  protected realign(): void {
    const el = this.track().nativeElement;
    el.scrollTo({ left: this.store.index() * el.clientWidth, behavior: 'auto' });
  }
}
