/**
 * What the parent feed app bar asks its page to do — the actions of the feature
 * only. The account's own actions (other space, invitation, language, sign out)
 * moved to the account sheet on 8 November 2026 (`AccountSheetActions`).
 */
export enum ParentFeedBarActions {
  /** Another linked child (US-PA01) — the picker is not built yet. */
  SwitchChild = 'SWITCH_CHILD',
}
