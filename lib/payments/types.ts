/**
 * Architecture de paiement modulaire. Chaque provider implémente `PaymentProvider`.
 * Aucune clé n'est stockée dans le code : tout vient des variables d'environnement.
 */
export type PaymentMethodCode = "CARD" | "BANK_TRANSFER" | "INVOICE";

export interface PaymentInit {
  orderId: string;
  orderNumber: string;
  amount: number; // centimes TTC
  currency: string;
  customerEmail: string;
  /** Données de formulaire propres au provider (ex. numéro de carte pour le mock). */
  payload?: Record<string, string | undefined>;
}

export type PaymentOutcome =
  | { status: "paid"; providerRef: string }
  | { status: "authorized"; providerRef: string }
  | { status: "pending"; providerRef: string | null; instructions?: string }
  | { status: "failed"; providerRef: string | null; code: string };

export interface PaymentProvider {
  code: string;
  method: PaymentMethodCode;
  /** Traite le paiement de façon synchrone (mock, virement, facture) ou initie une session (PSP). */
  process(init: PaymentInit): Promise<PaymentOutcome>;
}
