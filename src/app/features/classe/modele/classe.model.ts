export interface Devoir {
  nom: string;
  meta: string;
  val: string;
}

export interface Eleve {
  nom: string;
  val: string;
  /** Moyenne sous la note de passage — colore la valeur en `refus`. */
  bas?: boolean;
}
