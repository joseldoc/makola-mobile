import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type ListRowValueTone = 'neutre' | 'refus' | 'succes' | 'attente';

const VALUE_COLOR: Record<ListRowValueTone, string> = {
  neutre: 'var(--mk-text)',
  refus: 'var(--mk-refus)',
  succes: 'var(--mk-succes)',
  attente: 'var(--mk-attente)'
};

/**
 * La ligne de liste — l'unité de contenu du produit. 56 dp minimum,
 * alternance blanc / blanc cassé, bord gauche bleu si active, flash vert de
 * 420 ms à la confirmation.
 * Source: @makola Design System, components/data/ListRow.jsx.
 */
@Component({
  selector: 'app-list-row',
  template: `
    <div
      class="list-row"
      [class.alt]="!active() && !flash() && index() % 2 === 1"
      [class.active]="active()"
      [class.flash]="flash()"
      (click)="rowClick.emit()"
    >
      <ng-content select="[leading]" />
      <div class="texts">
        <div class="primary">{{ primary() }}</div>
        @if (secondary()) {
          <div class="secondary">{{ secondary() }}</div>
        }
        @if (tertiary()) {
          <div class="tertiary">{{ tertiary() }}</div>
        }
      </div>
      @if (hasValue()) {
        <div class="value" [class.grand]="isGrand()" [style.color]="valueColor()">{{ value() }}</div>
      }
      <ng-content select="[trailing]" />
    </div>
  `,
  styleUrl: './list-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListRowComponent {
  /** Nom d'élève, intitulé de devoir — graisse 500. */
  readonly primary = input.required<string>();
  readonly secondary = input('');
  readonly tertiary = input('');
  /** Note, moyenne, date. Court (≤ 5 car.) : rendu en 30 sp tabulaire. */
  readonly value = input<string | number>();
  /** `refus` sous la moyenne, `succes` confirmé, `attente` en cours. */
  readonly valueTone = input<ListRowValueTone>('neutre');
  /** Position dans la liste — pilote l'alternance de fond. Passez-la toujours. */
  readonly index = input(0);
  /** Élève courant de la saisie : bord gauche bleu + fond #F5F8FF. */
  readonly active = input(false);
  /** Confirmation : fond vert pâle pendant 420 ms. */
  readonly flash = input(false);
  readonly rowClick = output<void>();

  protected readonly hasValue = computed(() => this.value() !== undefined && this.value() !== null && this.value() !== '');
  protected readonly isGrand = computed(() => {
    const v = this.value();
    return v === undefined || v === null || String(v).length <= 5;
  });
  protected readonly valueColor = computed(() => VALUE_COLOR[this.valueTone()]);
}
