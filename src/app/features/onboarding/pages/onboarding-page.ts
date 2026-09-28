import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { SessionStore } from '@core/store/session/session.store';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';
import { ProgressDotsComponent } from '@core/shared/components/navigation/progress-dots/progress-dots';

import { OnboardingSlideComponent } from '../components';
import { OnboardingStore } from '../onboarding.store';

/**
 * Container de la présentation — 4 écrans, balayage natif (scroll-snap CSS,
 * aucune bibliothèque de geste), pastilles tapables dans les deux sens.
 * Vue une seule fois par appareil ; « Passer » et « Commencer » mènent à l'accueil.
 */
@Component({
  selector: 'app-onboarding-page',
  imports: [OnboardingSlideComponent, FooterActionComponent, OutlinedButtonComponent, ProgressDotsComponent],
  providers: [OnboardingStore],
  templateUrl: './onboarding-page.html',
  styleUrl: './onboarding-page.scss',
  host: { '(window:resize)': 'realigner()' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingPageComponent {
  protected readonly store = inject(OnboardingStore);
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

  protected aller(index: number): void {
    const el = this.track().nativeElement;
    const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: index * el.clientWidth, behavior: reduit ? 'auto' : 'smooth' });
    this.store.setIndex(index);
  }

  protected suivant(): void {
    if (this.store.dernier()) this.terminer();
    else this.aller(this.store.index() + 1);
  }

  protected terminer(): void {
    this.session.terminerOnboarding();
    void this.router.navigateByUrl('/auth', { replaceUrl: true });
  }

  /** Rotation, redimensionnement : l'écran courant reste celui affiché. */
  protected realigner(): void {
    const el = this.track().nativeElement;
    el.scrollTo({ left: this.store.index() * el.clientWidth, behavior: 'auto' });
  }
}
