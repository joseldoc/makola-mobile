import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type LogoVariant = 'lockup' | 'mark' | 'icon';
export type LogoTone = 'couleur' | 'encre' | 'blanc' | 'mono';

const TONS: Record<LogoTone, [trait: string, signet: string | null, texte: string]> = {
  couleur: ['var(--mk-bleu)', 'var(--mk-ambre)', 'var(--mk-encre)'],
  encre: ['var(--mk-encre)', 'var(--mk-ambre)', 'var(--mk-encre)'],
  blanc: ['#FFFFFF', 'var(--mk-role-parent)', '#FFFFFF'],
  mono: ['currentColor', null, 'currentColor']
};

/**
 * Marque @makola — le livre « m » : deux pages ouvertes dessinent les deux arches
 * du m, le signet tombe du dos. Tracé unique de 7,5 % de la hauteur, sans dégradé.
 * Splashscreen, connexion, en-tête de document — jamais dans une barre d'app.
 * Source: @makola Design System, components/brand/Logo.jsx.
 */
@Component({
  selector: 'app-logo',
  template: `
    <ng-template #mark let-size="size" let-trait="trait" let-signet="signet">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0.25 8.25 100 100" aria-hidden="true" class="mark">
        <path
          d="M13.75 75.75V44a18.25 18.25 0 0 1 36.5 0v31.75M50.25 44a18.25 18.25 0 0 1 36.5 0v31.75M10 75.75h80.5"
          fill="none"
          [attr.stroke]="trait"
          stroke-width="7.5"
        />
        @if (signet) {
          <path d="M45.25 79.5h10v15l-5-4.5-5 4.5z" [attr.fill]="signet" />
        }
      </svg>
    </ng-template>

    @switch (variant()) {
      @case ('icon') {
        <div
          class="icon"
          role="img"
          [attr.aria-label]="title()"
          [style.width.px]="size()"
          [style.height.px]="size()"
          [style.border-radius.px]="size() * 0.22"
        >
          <ng-container
            *ngTemplateOutlet="mark; context: { size: size() * 0.7, trait: '#FFFFFF', signet: tone() === 'mono' ? null : 'var(--mk-role-parent)' }"
          />
        </div>
      }
      @case ('mark') {
        <div class="inline" role="img" [attr.aria-label]="title()">
          <ng-container *ngTemplateOutlet="mark; context: { size: size(), trait: ton()[0], signet: ton()[1] }" />
        </div>
      }
      @default {
        <div class="inline lockup" role="img" [attr.aria-label]="title()" [style.gap.px]="size() * 0.22">
          <ng-container *ngTemplateOutlet="mark; context: { size: size(), trait: ton()[0], signet: ton()[1] }" />
          <span aria-hidden="true" class="name" [style.font-size.px]="size() * 0.7" [style.color]="ton()[2]">makola</span>
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .mark {
      display: block;
      flex: none;
    }
    .inline {
      display: inline-flex;
      align-items: center;
    }
    .icon {
      flex: none;
      background: var(--mk-bleu);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .name {
      font-family: var(--mk-font);
      font-weight: 400;
      line-height: 1;
      letter-spacing: -0.02em;
      white-space: nowrap;
    }
  `,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoComponent {
  /** `lockup` (signe + nom), `mark` (signe seul), `icon` (tuile d'application). */
  readonly variant = input<LogoVariant>('lockup');
  /** Hauteur du signe en px. Plancher : 24 pour le signe, 20 pour le lockup. */
  readonly size = input(32);
  /** `couleur` sur blanc uniquement · `blanc` sur le bleu primaire · `mono` sans signet. */
  readonly tone = input<LogoTone>('couleur');
  readonly title = input('@makola');

  protected readonly ton = computed(() => TONS[this.tone()]);
}
