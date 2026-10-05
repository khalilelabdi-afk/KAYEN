/**
 * Normalisation des quantités : MOQ et pas de commande.
 */
export function normalizeQuantity(quantity: number, moq: number, orderMultiple: number): number {
  const minimum = Math.max(1, moq || 1);
  const step = Math.max(1, orderMultiple || 1);
  let q = Number.isFinite(quantity) ? Math.trunc(quantity) : minimum;
  if (q < minimum) q = minimum;
  const remainder = (q - minimum) % step;
  if (remainder !== 0) q += step - remainder;
  return q;
}

/** Quantité suivante / précédente respectant MOQ et pas. */
export function stepQuantity(quantity: number, direction: 1 | -1, moq: number, orderMultiple: number): number {
  const step = Math.max(1, orderMultiple || 1);
  const minimum = Math.max(1, moq || 1);
  const next = normalizeQuantity(quantity, moq, orderMultiple) + direction * step;
  return Math.max(minimum, next);
}

export function isValidQuantity(quantity: number, moq: number, orderMultiple: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && normalizeQuantity(quantity, moq, orderMultiple) === quantity;
}
