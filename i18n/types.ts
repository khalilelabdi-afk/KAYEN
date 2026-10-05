export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** Remplace les littéraux de chaîne par `string` (pour les dictionnaires partiels). */
export type DeepWiden<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K] extends object ? DeepWiden<T[K]> : T[K];
};

export type PartialDictionary<T> = DeepPartial<DeepWiden<T>>;

/** Chemins "a.b.c" vers des feuilles string d'un objet. */
type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
export type LeafPaths<T> = {
  [K in keyof T]: T[K] extends string ? K & string : T[K] extends object ? Join<K, LeafPaths<T[K]>> : never;
}[keyof T];
