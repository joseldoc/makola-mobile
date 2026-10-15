import { TextFieldState } from '@core/shared/components/forms/text-field/text-field';
import { Message } from '@core/i18n/translate';

export type Scale = 20 | 10 | 5;

/** A candidate date and what the class calendar says about it (RM-14). */
export interface AssignmentDate {
  /** ISO date, formatted in the interface language. */
  date: string;
  today?: boolean;
  state: TextFieldState;
  /** Why the date is accepted, flagged or refused — dates inside are ISO. */
  message: Message;
}
