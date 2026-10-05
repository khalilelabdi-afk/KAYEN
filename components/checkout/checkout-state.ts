import "server-only";
import { cookies } from "next/headers";

/** État du checkout conservé dans un cookie HttpOnly (identifiants d'adresses, méthode, références). */
export const CHECKOUT_COOKIE = "kayen_checkout";

export interface CheckoutState {
  billingAddressId?: string;
  shippingAddressId?: string;
  shippingMethodCode?: string;
  poReference?: string;
  deliveryInstructions?: string;
  notes?: string;
}

export async function readCheckoutState(): Promise<CheckoutState> {
  try {
    const raw = (await cookies()).get(CHECKOUT_COOKIE)?.value;
    return raw ? (JSON.parse(raw) as CheckoutState) : {};
  } catch {
    return {};
  }
}

export async function writeCheckoutState(state: CheckoutState) {
  (await cookies()).set(CHECKOUT_COOKIE, JSON.stringify(state), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/checkout", maxAge: 60 * 60 * 2 });
}

export async function clearCheckoutState() {
  (await cookies()).set(CHECKOUT_COOKIE, "", { path: "/checkout", maxAge: 0 });
}
