/** What the calling-code sheet (`app-country-sheet`) asks its page to do. */
export enum CountrySheetActions {
  /** A country was picked: the sheet closes, there is nothing to confirm. */
  Choose = 'CHOOSE',
  /** Scrim, handle or Escape: the sheet closes without a change. */
  Close = 'CLOSE',
}
