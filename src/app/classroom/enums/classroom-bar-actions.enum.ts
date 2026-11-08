/**
 * What the classroom app bar asks its page to do — the actions of the feature
 * only. The account's own actions (other space, invitation, language, sign out)
 * moved to the account sheet on 8 November 2026 (`AccountSheetActions`).
 */
export enum ClassroomBarActions {
  /** Shows the teacher's next class — only when there is more than one. */
  SwitchClassroom = 'SWITCH_CLASSROOM',
  /** Opens the students view, where the search field is. */
  Search = 'SEARCH',
}
