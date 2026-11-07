/** What the parent feed app bar asks its page to do. */
export enum ParentFeedBarActions {
  /** Another linked child (US-PA01) — the picker is not built yet. */
  SwitchChild = 'SWITCH_CHILD',
  /** Shows the teacher space — only when the account also holds the teacher role (ID-02). */
  TeacherSpace = 'TEACHER_SPACE',
  /** Closes the session, every role at once. */
  SignOut = 'SIGN_OUT',
}
