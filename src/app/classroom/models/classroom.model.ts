export interface Assignment {
  /** Entered by the teacher — data, not interface: never translated. */
  name: string;
  coefficient: number;
  scale: number;
  /** ISO date, formatted in the interface language. */
  date: string;
  /**
   * Average of this assignment over the class — shown to the teacher and to the
   * parent, never compared and never turned into a rank (RM-11 as amended on
   * 6 November 2026).
   */
  classAverage: number;
}

export interface Student {
  name: string;
  average: number;
  /** Average under the pass mark — shows the value in `danger`. */
  belowPass?: boolean;
}
