import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export type TextFieldState = 'repos' | 'focus' | 'erreur' | 'alerte' | 'valide';

const TEINTE: Record<TextFieldState, string> = {
  repos: 'var(--mk-contour)',
  focus: 'var(--mk-primaire)',
  erreur: 'var(--mk-refus)',
  alerte: 'var(--mk-attente)',
  valide: 'var(--mk-succes)'
};

/**
 * Champ M3 outlined — libellé dans l'encoche du contour. Cinq états : repos,
 * focus, erreur (bloque), alerte (n'empêche pas), valide. Un refus dit
 * toujours quoi faire. Source: @makola Design System, components/forms/TextField.jsx.
 */
@Component({
  selector: 'app-text-field',
  template: `
    <div>
      <div
        class="field"
        [class.focused]="etat() === 'focus'"
        [style.border-color]="col()"
      >
        <span class="label" [style.color]="col()">{{ label() }}</span>
        @if (multiline()) {
          <textarea
            class="control"
            rows="3"
            [value]="value()"
            [disabled]="disabled()"
            [placeholder]="placeholder()"
            (input)="onInput($event)"
            (focus)="focused.set(true)"
            (blur)="focused.set(false)"
          ></textarea>
        } @else {
          <input
            class="control"
            [type]="type()"
            [value]="value()"
            [disabled]="disabled()"
            [placeholder]="placeholder()"
            (input)="onInput($event)"
            (focus)="focused.set(true)"
            (blur)="focused.set(false)"
          />
        }
      </div>
      @if (message() || counter()) {
        <div class="meta">
          <div class="message" [style.color]="etat() === 'repos' || etat() === 'focus' ? 'var(--mk-text-secondaire)' : col()">
            {{ message() }}
          </div>
          @if (counter()) {
            <div class="counter">{{ counter() }}</div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './text-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextFieldComponent {
  /** Affiché dans l'encoche du contour, jamais en placeholder seul. */
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();
  readonly placeholder = input('');
  /** `erreur` bloque l'envoi, `alerte` ne l'empêche pas, `valide` l'affirme. */
  readonly state = input<TextFieldState>('repos');
  /** Obligatoire dès que `state` vaut erreur / alerte / valide : dites QUOI FAIRE. */
  readonly message = input('');
  /** Ex. « 48 / 60 ». Réservé aux champs à longueur bornée. */
  readonly counter = input('');
  readonly type = input('text');
  /** Réservé aux valeurs dictées par une règle de gestion, jamais par confort. */
  readonly disabled = input(false);
  readonly multiline = input(false);

  protected readonly focused = signal(false);

  protected readonly etat = computed<TextFieldState>(() => {
    if (this.disabled()) return 'repos';
    if (this.focused() && this.state() === 'repos') return 'focus';
    return this.state();
  });

  protected readonly col = computed(() => TEINTE[this.etat()]);

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.valueChange.emit(target.value);
  }
}
