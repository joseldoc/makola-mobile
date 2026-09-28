import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CodeSlotsEtat = 'repos' | 'verification' | 'erreur';

/**
 * Les cases d'un code à chiffres — saisi au pavé dédié, jamais au clavier
 * système (Keypad, columns=3). Chiffres en 30 sp tabulaires ; la case suivante
 * porte le contour bleu, le refus passe tout le code en rouge.
 */
@Component({
  selector: 'app-code-slots',
  template: `
    <div class="slots" [class.erreur]="etat() === 'erreur'" [class.verification]="etat() === 'verification'" aria-hidden="true">
      @for (i of cases(); track i) {
        <div class="slot" [class.pleine]="i < valeur().length" [class.suivante]="i === valeur().length && etat() === 'repos'">
          {{ valeur()[i] ?? '' }}
        </div>
      }
    </div>
    <span class="sr" aria-live="polite">{{ annonce() }}</span>
  `,
  styleUrl: './code-slots.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeSlotsComponent {
  readonly valeur = input.required<string>();
  readonly longueur = input(6);
  readonly etat = input<CodeSlotsEtat>('repos');

  protected readonly cases = computed(() => Array.from({ length: this.longueur() }, (_, i) => i));
  protected readonly annonce = computed(() => {
    if (this.etat() === 'verification') return 'Vérification du code.';
    return `${this.valeur().length} chiffre(s) saisi(s) sur ${this.longueur()}.`;
  });
}
