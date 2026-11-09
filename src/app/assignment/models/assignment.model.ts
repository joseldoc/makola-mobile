import { TextFieldState } from '@shared/forms/text-field/text-field';
import { Message } from '@core/i18n/translate';
import { PeriodCalendar } from '@core/models/period';

/** A candidate date and what the class calendar says about it (RM-14). */
export interface AssignmentDate {
  /** ISO date, formatted in the interface language. */
  date: string;
  today?: boolean;
  state: TextFieldState;
  /** Why the date is accepted, flagged or refused — dates inside are ISO. */
  message: Message;
}

/** The class a new assignment is created in — given by the screen that opens the sheet. */
export interface AssignmentContext {
  /** Class and subject labels: school data, never translated. */
  classroom: string;
  subject: string;
  calendar: PeriodCalendar;
  /** Titles already used in this class this period (compared case-insensitively, RM-13). */
  existingTitles: string[];
}
