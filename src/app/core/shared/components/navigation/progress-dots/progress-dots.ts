import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type ProgressDotsTone = 'primaire' | 'attente' | 'succes';

const TONE_COLOR: Record<ProgressDotsTone, string> = {
  primaire: 'var(--mk-primaire)',
  attente: 'var(--mk-attente)',
  succes: 'var(--mk-succes)'
};

/**
 * Pastilles de progression — l'active s'allonge à 26 dp, les passées pâlissent.
 * Tapables dans les deux sens : on peut revenir.
 * Source: @makola Design System, components/navigation/ProgressDots.jsx.
 */
@Component({
  selector: 'app-progress-dots',
  template: `
    <div class="progress-dots" role="tablist" [attr.aria-label]="label()">
      @for (i of indices(); track i) {
        <button
          type="button"
          class="dot"
          role="tab"
          [attr.aria-selected]="i === index()"
          [attr.aria-label]="'Écran ' + (i + 1) + ' sur ' + count()"
          [style.width.px]="i === index() ? 26 : 6"
          [style.background]="dotColor(i)"
          (click)="indexChange.emit(i)"
        ></button>
      }
    </div>
  `,
  styleUrl: './progress-dots.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressDotsComponent {
  readonly count = input.required<number>();
  readonly index = input.required<number>();
  /** Tapable dans les deux sens : l'utilisateur peut revenir en arrière. */
  readonly indexChange = output<number>();
  readonly tone = input<ProgressDotsTone>('primaire');
  /** Nom du groupe pour les lecteurs d'écran. */
  readonly label = input('Progression');

  protected readonly indices = computed(() => Array.from({ length: this.count() }, (_, i) => i));
  protected readonly color = computed(() => TONE_COLOR[this.tone()]);

  protected dotColor(i: number): string {
    const current = this.index();
    if (i === current) return this.color();
    if (i < current) return `color-mix(in srgb, ${this.color()} 34%, transparent)`;
    return 'rgba(16,26,46,.18)';
  }
}
