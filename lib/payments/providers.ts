import "server-only";
import type { PaymentProvider } from "./types";

/** Carte bancaire — mock de développement (aucun paiement réel). Remplacer par Stripe/autre via PAYMENT_CARD_PROVIDER. */
const mockCard: PaymentProvider = {
  code: "mock",
  method: "CARD",
  async process(init) {
    const number = (init.payload?.cardNumber ?? "").replace(/\s/g, "");
    if (!/^\d{12,19}$/.test(number)) return { status: "failed", providerRef: null, code: "invalid_card" };
    // Convention de test : un numéro se terminant par "0000" échoue.
    if (number.endsWith("0000")) return { status: "failed", providerRef: null, code: "card_declined" };
    return { status: "paid", providerRef: `mock_${init.orderNumber}_${Date.now()}` };
  },
};

/** Stripe — à compléter avec le SDK (PaymentIntent). Refuse explicitement tant que les clés manquent. */
const stripeCard: PaymentProvider = {
  code: "stripe",
  method: "CARD",
  async process() {
    if (!process.env.STRIPE_SECRET_KEY) return { status: "failed", providerRef: null, code: "provider_not_configured" };
    return { status: "failed", providerRef: null, code: "provider_not_implemented" };
  },
};

const bankTransfer: PaymentProvider = {
  code: "bank_transfer",
  method: "BANK_TRANSFER",
  async process(init) {
    return { status: "pending", providerRef: `vir_${init.orderNumber}`, instructions: "bank_transfer" };
  },
};

const invoice: PaymentProvider = {
  code: "invoice",
  method: "INVOICE",
  async process(init) {
    return { status: "pending", providerRef: `inv_${init.orderNumber}`, instructions: "invoice" };
  },
};

export function getPaymentProvider(method: "CARD" | "BANK_TRANSFER" | "INVOICE"): PaymentProvider {
  switch (method) {
    case "CARD":
      return process.env.PAYMENT_CARD_PROVIDER === "stripe" ? stripeCard : mockCard;
    case "BANK_TRANSFER":
      return bankTransfer;
    case "INVOICE":
      return invoice;
  }
}
