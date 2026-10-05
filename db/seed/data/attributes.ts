import type { SeedAttribute } from "../types";

/**
 * Attributs produits. Les codes sont référencés par les catégories
 * (filtres) et par les produits (`attributes`).
 */
export const attributes: SeedAttribute[] = [
  { code: "material", name: "Matériau", type: "SELECT", isFilterable: true },
  { code: "capacity", name: "Capacité", type: "NUMBER", unit: "L", isFilterable: true },
  { code: "volume", name: "Volume", type: "SELECT", isFilterable: true },
  { code: "color", name: "Couleur", type: "SELECT", isFilterable: true },
  { code: "format", name: "Format", type: "SELECT", isFilterable: true },
  { code: "dimensions", name: "Dimensions", type: "TEXT", isFilterable: false },
  { code: "weight", name: "Poids", type: "NUMBER", unit: "kg", isFilterable: true },
  { code: "usage", name: "Usage", type: "SELECT", isFilterable: true },
  { code: "fragrance", name: "Parfum", type: "SELECT", isFilterable: true },
  { code: "power", name: "Puissance", type: "NUMBER", unit: "W", isFilterable: true },
  { code: "size", name: "Taille", type: "SELECT", isFilterable: true },
  { code: "thickness", name: "Épaisseur", type: "NUMBER", unit: "mm", isFilterable: true },
  { code: "length", name: "Longueur", type: "NUMBER", unit: "m", isFilterable: true },
  { code: "compostable", name: "Compostable", type: "BOOLEAN", isFilterable: true },
  { code: "microwave_safe", name: "Compatible micro-ondes", type: "BOOLEAN", isFilterable: true },
  { code: "load_capacity", name: "Charge maximale", type: "NUMBER", unit: "kg", isFilterable: true },
];
