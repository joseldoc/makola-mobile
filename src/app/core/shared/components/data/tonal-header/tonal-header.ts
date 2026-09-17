import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type TonalHeaderRole = 'prof' | 'parent' | 'etab' | 'neutre';

const ROLE: Record<TonalHeaderRole, [fond: string, forme: string]> = {
  prof: ['var(--mk-role-prof)', 'var(--mk-role-prof-forme)'],
  parent: ['var(--mk-role-parent)', 'var(--mk-role-parent-forme)'],
  etab: ['var(--mk-role-etab)', 'var(--mk-role-etab-forme)'],
  neutre: ['var(--mk-role-neutre)', 'var(--mk-role-neutre-forme)']
};

/**
 * Bandeau tonal M3 — deux formes rondes qui débordent, jamais de dégradé.
 * Un seul par écran, toujours en haut.
 * Source: @makola Design System, components/data/TonalHeader.jsx.
 */
@Component({
  selector: 'app-tonal-header',
  template: `
    <div class="tonal-header" [class.compact]="compact()" [style.background]="fond()">
      <div class="shape shape-top" [style.background]="forme()"></div>
      <div class="shape shape-bottom" [style.background]="forme()"></div>
      <div class="content">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './tonal-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TonalHeaderComponent {
  readonly role = input<TonalHeaderRole>('prof');
  /** Padding réduit — pour un bandeau sous une barre d'app. */
  readonly compact = input(false);

  protected readonly fond = computed(() => ROLE[this.role()][0]);
  protected readonly forme = computed(() => ROLE[this.role()][1]);
}
