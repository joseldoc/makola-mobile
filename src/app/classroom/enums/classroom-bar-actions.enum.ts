/** What the classroom app bar asks its page to do. */
export enum ClassroomBarActions {
  /** Opens the students view, where the search field is. */
  Search = 'SEARCH',
  /** Shows the parent space — only when the account also holds the parent role (ID-02). */
  ParentSpace = 'PARENT_SPACE',
  /** Closes the session, every role at once. */
  SignOut = 'SIGN_OUT',
}
