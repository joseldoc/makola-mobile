import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export type FooterActionTone = 'primary' | 'pending' | 'danger';

/**
 * The main action of a screen, at the bottom, full width. One per screen.
 * Unavailable: `missingLabel` must say what is missing — never a greyed-out "Submit".
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
      (pointercancel)="held.set(false)"
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
  /** Resting label, in the imperative: "Create and enter grades". */
  readonly label = input.required<string>();
  /** Label when `disabled` — must say WHAT IS MISSING. */
  readonly missingLabel = input<string>();
  readonly disabled = input(false);
  /** `primary` by default. `pending` for the parent role, `danger` for a revocation. */
  readonly tone = input<FooterActionTone>('primary');
  readonly pressed = output<void>();

  protected readonly held = signal(false);

  protected readonly background = computed(() => {
    if (this.disabled()) return 'var(--mk-inactif-fond)';
    if (this.tone() === 'pending') return 'var(--mk-attente)';
    if (this.tone() === 'danger') return 'var(--mk-refus)';
    return 'var(--mk-primaire)';
  });

  protected handleClick(): void {
    if (!this.disabled()) this.pressed.emit();
  }
}
