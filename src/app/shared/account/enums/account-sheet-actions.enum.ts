/**
 * What the account sheet (`app-account-sheet`) asks the home page of a space to
 * do. The sheet is shared by both spaces (classroom, parent feed): each home
 * page `switch`es on these.
 */
export enum AccountSheetActions {
  /** Shows another space of the account — offered only when it holds that role (RM-19). */
  SwitchSpace = 'SWITCH_SPACE',
  /** Opens the invitation flow without signing out (A-23). */
  JoinInvitation = 'JOIN_INVITATION',
  /** A language was picked: the interface changes at once, the sheet stays open. */
  ChangeLanguage = 'CHANGE_LANGUAGE',
  /** An appearance was picked (system, light, dark): the theme changes at once, the sheet stays open. */
  ChangeAppearance = 'CHANGE_APPEARANCE',
  /** Closes the session, every role at once. */
  SignOut = 'SIGN_OUT',
  /** Scrim, handle or Escape: the sheet closes without a change. */
  Close = 'CLOSE',
}
