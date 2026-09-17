import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export type FooterActionTone = 'primaire' | 'attente' | 'refus';

/**
 * L'action principale d'un écran, en pied, pleine largeur. Une seule par écran.
 * Indisponible : `missingLabel` doit dire ce qui manque — jamais un "Valider" grisé.
 * Source: @makola Design System, components/actions/FooterAction.jsx.
 */
@Component({
  selector: 'app-footer-action',
  template: `
    <button
      type="button"
      class="footer-action"
      [disabled]="disabled()"
      (click)="handleClick()"
      (pointerdown)="held.set(true)"
      (pointerup)="held.set(false)"
      (pointerleave)="held.set(false)"
      [style.background]="background()"
      [style.color]="disabled() ? 'var(--mk-inactif-text)' : 'var(--mk-text-sur-primaire)'"
      [style.box-shadow]="disabled() ? 'none' : '0 0 0 3px var(--mk-primaire-halo)'"
      [style.transform]="held() && !disabled() ? 'scale(var(--mk-echelle-action))' : 'none'"
      [style.filter]="held() && !disabled() ? 'brightness(.92)' : 'none'"
    >{{ disabled() ? (missingLabel() || label()) : label() }}</button>
  `,
  styleUrl: './footer-action.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterActionComponent {
  /** Libellé au repos, à l'impératif : « Créer et saisir les notes ». */
  readonly label = input.required<string>();
  /** Libellé quand `disabled` — doit dire CE QUI MANQUE, pas « Valider ». */
  readonly missingLabel = input<string>();
  readonly disabled = input(false);
  /** `primaire` par défaut. `attente` pour un rôle parent, `refus` pour une révocation. */
  readonly tone = input<FooterActionTone>('primaire');
  readonly pressed = output<void>();

  protected readonly held = signal(false);

  protected readonly background = computed(() => {
    if (this.disabled()) return 'var(--mk-inactif-fond)';
    if (this.tone() === 'attente') return 'var(--mk-attente)';
    if (this.tone() === 'refus') return 'var(--mk-refus)';
    return 'var(--mk-primaire)';
  });

  protected handleClick(): void {
    if (!this.disabled()) this.pressed.emit();
  }
}
