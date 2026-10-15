import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';

export type TextFieldState = 'idle' | 'focus' | 'error' | 'warning' | 'valid';

const TINT: Record<TextFieldState, string> = {
  idle: 'var(--mk-contour)',
  focus: 'var(--mk-primaire)',
  error: 'var(--mk-refus)',
  warning: 'var(--mk-attente)',
  valid: 'var(--mk-succes)'
};

let nextId = 0;

/**
 * M3 outlined field — label in the outline notch. Five states: idle, focus,
 * error (blocks), warning (does not block), valid. A refusal always says what
 * to do. Source: @makola Design System, components/forms/TextField.jsx.
 *
 * Signal forms control (`FormValueControl`): bind it with `[formField]`, or by
 * hand with `[value]` / `(valueChange)`. Bound to a field, it shows the first
 * validation error once the field has been left.
 */
@Component({
  selector: 'app-text-field',
  template: `
    <div>
      <div class="field" [class.focused]="state_() === 'focus'" [style.border-color]="tint()">
        <label class="label" [for]="id" [style.color]="tint()">{{ label() }}</label>
        @if (multiline()) {
          <textarea
            class="control"
            rows="3"
            [id]="id"
            [value]="value()"
            [disabled]="disabled()"
            [placeholder]="placeholder()"
            [attr.aria-invalid]="state_() === 'error'"
            [attr.aria-describedby]="helpText() ? id + '-help' : null"
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
            [attr.aria-invalid]="state_() === 'error'"
            [attr.aria-describedby]="helpText() ? id + '-help' : null"
            (input)="onInput($event)"
            (focus)="focused.set(true)"
            (blur)="onBlur()"
          />
        }
      </div>
      @if (helpText() || counter()) {
        <div class="meta">
          <div
            class="message"
            [id]="id + '-help'"
            [attr.role]="state_() === 'error' ? 'alert' : null"
            [style.color]="state_() === 'idle' || state_() === 'focus' ? 'var(--mk-text-secondaire)' : tint()"
          >
            {{ helpText() }}
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
  /** Shown in the outline notch, never as a placeholder alone. Already translated. */
  readonly label = input.required<string>();
  readonly value = model.required<string>();
  readonly placeholder = input('');
  /** `error` blocks submission, `warning` does not, `valid` affirms. */
  readonly state = input<TextFieldState>('idle');
  /** Required as soon as `state` is error / warning / valid: say WHAT TO DO. */
  readonly message = input('');
  /** E.g. "48 / 60". Reserved for length-bounded fields. */
  readonly counter = input('');
  readonly type = input('text');
  /** Reserved for values dictated by a business rule, never for comfort. */
  readonly disabled = input(false);
  readonly multiline = input(false);
  /** Adapted virtual keyboard: `tel`, `email`, `numeric`… */
  readonly inputmode = input('');
  readonly autocomplete = input('');
  readonly enterkeyhint = input('');

  // ── Signal forms binding (set by `[formField]`) ──
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touched = input(false);
  readonly touch = output<void>();

  protected readonly id = `mk-field-${nextId++}`;
  protected readonly focused = signal(false);

  /** Validation error to show: only once the user has left the field. */
  private readonly visibleError = computed(() => (this.touched() ? this.errors()[0] : undefined));

  protected readonly helpText = computed(() => this.visibleError()?.message ?? this.message());

  protected readonly state_ = computed<TextFieldState>(() => {
    if (this.disabled()) return 'idle';
    if (this.visibleError()) return 'error';
    if (this.focused() && this.state() === 'idle') return 'focus';
    return this.state();
  });

  protected readonly tint = computed(() => TINT[this.state_()]);

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value.set(target.value);
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.touch.emit();
  }
}
