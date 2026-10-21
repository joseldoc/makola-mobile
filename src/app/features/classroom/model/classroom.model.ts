export interface Assignment {
  /** Entered by the teacher — data, not interface: never translated. */
  name: string;
  coefficient: number;
  scale: number;
  /** ISO date, formatted in the interface language. */
  date: string;
  /** Average of this assignment for the class. */
  average: number;
}

export interface Student {
  name: string;
  average: number;
  /** Average under the pass mark — shows the value in `danger`. */
  belowPass?: boolean;
}
