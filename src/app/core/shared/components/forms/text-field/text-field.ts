import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';

export type TextFieldState = 'repos' | 'focus' | 'erreur' | 'alerte' | 'valide';

const TEINTE: Record<TextFieldState, string> = {
  repos: 'var(--mk-contour)',
  focus: 'var(--mk-primaire)',
  erreur: 'var(--mk-refus)',
  alerte: 'var(--mk-attente)',
  valide: 'var(--mk-succes)'
};

let prochainId = 0;

/**
 * Champ M3 outlined — libellé dans l'encoche du contour. Cinq états : repos,
 * focus, erreur (bloque), alerte (n'empêche pas), valide. Un refus dit
 * toujours quoi faire. Source: @makola Design System, components/forms/TextField.jsx.
 *
 * Contrôle de formulaire signal (`FormValueControl`) : se lie par `[formField]`,
 * ou à la main par `[value]` / `(valueChange)`. Lié à un champ, il affiche la
 * première erreur de validation une fois le champ quitté.
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
        <label class="label" [for]="id" [style.color]="col()">{{ label() }}</label>
        @if (multiline()) {
          <textarea
            class="control"
            rows="3"
            [id]="id"
            [value]="value()"
            [disabled]="disabled()"
            [placeholder]="placeholder()"
            [attr.aria-invalid]="etat() === 'erreur'"
            [attr.aria-describedby]="texteAide() ? id + '-aide' : null"
            (input)="onInput($event)"
            (focus)="focused.set(true)"
            (blur)="onBlur()"
          ></textarea>
        } @else {
          <input
            class="control"
            [id]="id"
            [type]="type()"
            [value]="value()"
            [disabled]="disabled()"
            [placeholder]="placeholder()"
            [attr.inputmode]="inputmode() || null"
            [attr.autocomplete]="autocomplete() || null"
            [attr.enterkeyhint]="enterkeyhint() || null"
            [attr.aria-invalid]="etat() === 'erreur'"
            [attr.aria-describedby]="texteAide() ? id + '-aide' : null"
            (input)="onInput($event)"
            (focus)="focused.set(true)"
            (blur)="onBlur()"
          />
        }
      </div>
      @if (texteAide() || counter()) {
        <div class="meta">
          <div
            class="message"
            [id]="id + '-aide'"
            [attr.role]="etat() === 'erreur' ? 'alert' : null"
            [style.color]="etat() === 'repos' || etat() === 'focus' ? 'var(--mk-text-secondaire)' : col()"
          >
            {{ texteAide() }}
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
export class TextFieldComponent implements FormValueControl<string> {
  /** Affiché dans l'encoche du contour, jamais en placeholder seul. */
  readonly label = input.required<string>();
  readonly value = model.required<string>();
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
  /** Clavier virtuel adapté : `tel`, `email`, `numeric`… */
  readonly inputmode = input('');
  readonly autocomplete = input('');
  readonly enterkeyhint = input('');

  // ── Liaison signal forms (renseignées par `[formField]`) ──
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touched = input(false);
  readonly touch = output<void>();

  protected readonly id = `mk-champ-${prochainId++}`;

  protected readonly focused = signal(false);

  /** Erreur de validation à montrer : seulement après que l'utilisateur a quitté le champ. */
  private readonly erreurVisible = computed(() => (this.touched() ? this.errors()[0] : undefined));

  protected readonly texteAide = computed(() => this.erreurVisible()?.message ?? this.message());

  protected readonly etat = computed<TextFieldState>(() => {
    if (this.disabled()) return 'repos';
    if (this.erreurVisible()) return 'erreur';
    if (this.focused() && this.state() === 'repos') return 'focus';
    return this.state();
  });

  protected readonly col = computed(() => TEINTE[this.etat()]);

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value.set(target.value);
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.touch.emit();
  }
}
