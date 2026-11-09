import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Language } from '@core/i18n/language';
import { Identifier, Role } from '@core/models/auth.model';
import { maskIdentifier } from '@core/models/identifier';

import { LanguageSwitchComponent } from '../../actions/language-switch/language-switch';
import { BottomSheetComponent } from '../../navigation/bottom-sheet/bottom-sheet';
import { AccountSheetActions } from '../enums/account-sheet-actions.enum';

/** The single event of the sheet: a space or a language travels with its action. */
export type AccountSheetEvent =
  | { action: AccountSheetActions.SwitchSpace; role: Role }
  | { action: AccountSheetActions.ChangeLanguage; language: Language }
  | {
      action:
        | AccountSheetActions.JoinInvitation
        | AccountSheetActions.SignOut
        | AccountSheetActions.Close;
    };

/**
 * Account sheet (decision of 8 November 2026): what concerns the account rather
 * than the space shown — its name and masked identifier, its other space when it
 * holds both roles (RM-19), joining an invitation without signing out (A-23, in
 * both spaces), the language, signing out. Opened by the account button at the
 * end of the app bar of each space's home; the app bars keep the actions of their
 * feature only.
 *
 * Presentation only: one typed event, the home page decides (`AccountSheetActions`).
 *
 * Source: none in the design system — composed of `app-bottom-sheet` and
 * `app-language-switch` (used as is). Rows are buttons, 56 dp, separated by a
 * line, like `app-list-row` (which is not a button: no keyboard, no role).
 */
@Component({
  selector: 'app-account-sheet',
  imports: [BottomSheetComponent, LanguageSwitchComponent, TranslocoPipe],
  template: `
    <app-bottom-sheet
      [title]="title()"
      [text]="subtitle()"
      (closed)="sheetAction.emit({ action: Actions.Close })"
    >
      <div class="rows">
        @for (role of otherSpaces(); track role) {
          <button
            type="button"
            class="row"
            (click)="sheetAction.emit({ action: Actions.SwitchSpace, role })"
          >
            <span class="label">{{ 'spaces.' + role | transloco }}</span>
            <span class="detail">{{ 'account.spaceDetail.' + role | transloco }}</span>
          </button>
        }
        <button
          type="button"
          class="row"
          (click)="sheetAction.emit({ action: Actions.JoinInvitation })"
        >
          <span class="label">{{ 'account.join' | transloco }}</span>
          <span class="detail">{{ 'account.joinDetail' | transloco }}</span>
        </button>

        <!-- Settings of the device. The appearance (dark mode) goes here, beside the language. -->
        <div class="row setting">
          <span class="label">{{ 'language.label' | transloco }}</span>
          <app-language-switch
            [value]="language()"
            (valueChange)="sheetAction.emit({ action: Actions.ChangeLanguage, language: $event })"
          />
        </div>

        <button type="button" class="row" (click)="sheetAction.emit({ action: Actions.SignOut })">
          <span class="label">{{ 'common.signOut' | transloco }}</span>
          @if (otherSpaces().length) {
            <span class="detail">{{ 'account.signOutAll' | transloco }}</span>
          }
        </button>
      </div>
    </app-bottom-sheet>
  `,
  styleUrl: './account-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSheetComponent {
  /** « NKOUKA Joseph » — absent while the account has no name yet. */
  readonly name = input<string>();
  readonly identifier = input.required<Identifier>();
  /** The account's spaces other than the one shown: none for a single role. */
  readonly otherSpaces = input<Role[]>([]);
  readonly language = input.required<Language>();
  /** One output for every action of the sheet — the home page decides what each one does. */
  readonly sheetAction = output<AccountSheetEvent>();

  protected readonly Actions = AccountSheetActions;

  private readonly masked = computed(() => maskIdentifier(this.identifier()));
  /** The name, else the masked identifier: the sheet always says whose account it is. */
  protected readonly title = computed(() => this.name() || this.masked());
  protected readonly subtitle = computed(() => (this.name() ? this.masked() : ''));
}
