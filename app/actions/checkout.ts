"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getT } from "@/i18n/server";
import { getCurrentUser, getPricingContext, canOrder, type ActionResult } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { addressSchema, fieldErrors, formDataToObject } from "@/lib/validation/common";
import { checkoutInformationSchema, checkoutPaymentSchema, checkoutShippingSchema } from "@/lib/validation/checkout";
import { placeOrder, type AddressSnapshot } from "@/services/orders";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/services/settings";
import { readCheckoutState, writeCheckoutState, clearCheckoutState, type CheckoutState } from "@/components/checkout/checkout-state";

export type CheckoutFormState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

type SaveAddressResult = { error: Record<string, string[]>; address?: undefined } | { address: { id: string }; error?: undefined };

async function saveAddress(businessId: string, raw: Record<string, unknown>, prefix: string): Promise<SaveAddressResult> {
  const sub: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) if (k.startsWith(`${prefix}.`)) sub[k.slice(prefix.length + 1)] = v;
  const parsed = addressSchema.safeParse(sub);
  if (!parsed.success) return { error: fieldErrors(parsed.error) };
  const d = parsed.data;
  const address = await db.address.create({
    data: { businessId, label: d.label || null, type: d.type, company: d.company || null, firstName: d.firstName || null, lastName: d.lastName || null, line1: d.line1, line2: d.line2 || null, postalCode: d.postalCode, city: d.city, region: d.region || null, countryCode: d.countryCode, phone: d.phone || null, instructions: d.instructions || null },
  });
  return { address };
}

export async function checkoutInformationAction(_prev: CheckoutFormState, formData: FormData): Promise<CheckoutFormState> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business || !canOrder(user)) return { error: t("checkout.errors.businessNotApproved") };
  const raw = formDataToObject(formData);
  const parsed = checkoutInformationSchema.safeParse(raw);
  if (!parsed.success) return { error: t("common.errors.validation"), fieldErrors: fieldErrors(parsed.error) };
  const businessId = user.business.id;
  const state = await readCheckoutState();

  let billingId = parsed.data.billingAddressId || "";
  if (billingId === "new") {
    const res = await saveAddress(businessId, raw, "newBilling");
    if (res.error) return { error: t("common.errors.validation"), fieldErrors: Object.fromEntries(Object.entries(res.error).map(([k, v]) => [`newBilling.${k}`, v.map(() => t("common.errors.required"))])) };
    billingId = res.address.id;
  }
  if (!billingId) return { error: t("checkout.errors.addressRequired"), fieldErrors: { billingAddressId: [t("checkout.errors.addressRequired")] } };
  const billing = await db.address.findFirst({ where: { id: billingId, businessId } });
  if (!billing) return { error: t("checkout.errors.addressRequired") };

  let shippingId = parsed.data.sameAsBilling ? billingId : parsed.data.shippingAddressId || "";
  if (shippingId === "new") {
    const res = await saveAddress(businessId, raw, "newShipping");
    if (res.error) return { error: t("common.errors.validation"), fieldErrors: Object.fromEntries(Object.entries(res.error).map(([k, v]) => [`newShipping.${k}`, v.map(() => t("common.errors.required"))])) };
    shippingId = res.address.id;
  }
  if (!shippingId) return { error: t("checkout.errors.addressRequired"), fieldErrors: { shippingAddressId: [t("checkout.errors.addressRequired")] } };
  const shipping = await db.address.findFirst({ where: { id: shippingId, businessId } });
  if (!shipping) return { error: t("checkout.errors.addressRequired") };

  await writeCheckoutState({ ...state, billingAddressId: billingId, shippingAddressId: shippingId, poReference: parsed.data.poReference || undefined, deliveryInstructions: parsed.data.deliveryInstructions || undefined, notes: parsed.data.notes || undefined });
  revalidatePath("/account/addresses");
  redirect("/checkout/shipping");
}

export async function checkoutShippingAction(_prev: CheckoutFormState, formData: FormData): Promise<CheckoutFormState> {
  const t = await getT();
  const parsed = checkoutShippingSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: t("checkout.errors.shippingRequired") };
  const state: CheckoutState = await readCheckoutState();
  if (!state.shippingAddressId) redirect("/checkout");
  await writeCheckoutState({ ...state, shippingMethodCode: parsed.data.shippingMethodCode });
  redirect("/checkout/payment");
}

export async function checkoutPaymentAction(_prev: CheckoutFormState, formData: FormData): Promise<CheckoutFormState> {
  const t = await getT();
  const [user, ctx] = await Promise.all([getCurrentUser(), getPricingContext()]);
  if (!user?.business || !canOrder(user)) return { error: t("checkout.errors.businessNotApproved") };
  const raw = formDataToObject(formData);
  const parsed = checkoutPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = fieldErrors(parsed.error);
    return { error: fe.terms ? t("checkout.errors.termsRequired") : t("checkout.errors.paymentRequired"), fieldErrors: fe };
  }
  const state = await readCheckoutState();
  if (!state.billingAddressId || !state.shippingAddressId) redirect("/checkout");
  if (!state.shippingMethodCode) redirect("/checkout/shipping");
  const [billing, shipping] = await Promise.all([
    db.address.findFirst({ where: { id: state.billingAddressId, businessId: user.business.id } }),
    db.address.findFirst({ where: { id: state.shippingAddressId, businessId: user.business.id } }),
  ]);
  if (!billing || !shipping) redirect("/checkout");
  const snap = (a: NonNullable<typeof billing>): AddressSnapshot => ({ label: a.label, company: a.company, firstName: a.firstName, lastName: a.lastName, line1: a.line1, line2: a.line2, postalCode: a.postalCode, city: a.city, region: a.region, countryCode: a.countryCode, phone: a.phone, instructions: a.instructions });

  const result = await placeOrder(user as typeof user & { business: NonNullable<typeof user.business> }, ctx, {
    billingAddress: snap(billing),
    shippingAddress: snap(shipping),
    shippingMethodCode: state.shippingMethodCode,
    paymentMethod: parsed.data.paymentMethod,
    paymentPayload: { cardNumber: parsed.data.cardNumber, cardExpiry: parsed.data.cardExpiry, cardCvc: parsed.data.cardCvc, cardName: parsed.data.cardName },
    poReference: state.poReference,
    deliveryInstructions: state.deliveryInstructions,
    notes: state.notes,
  });
  if (!result.ok) {
    const settings = await getSettings();
    switch (result.error) {
      case "cart_empty": return { error: t("checkout.errors.cartEmpty") };
      case "cart_changed": return { error: t("checkout.validation.desc") };
      case "stock": return { error: `${t("checkout.errors.stock")}${result.detail ? ` (${result.detail})` : ""}` };
      case "shipping_invalid": return { error: t("checkout.errors.shippingRequired") };
      case "payment_not_allowed": return { error: t("checkout.payment.invoiceUnavailable") };
      case "payment_failed": return { error: t("checkout.payment.failed") };
      case "minimum_order": return { error: t("checkout.errors.minimumOrder", { amount: formatMoney(settings.minimumOrderAmount) }) };
    }
  }
  await clearCheckoutState();
  revalidatePath("/", "layout");
  redirect(`/checkout/confirmation/${result.orderId}`);
}

export async function saveCheckoutAddressAction(input: Record<string, unknown>): Promise<ActionResult<{ id: string }>> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user?.business) return { ok: false, error: t("common.errors.unauthorized") };
  const res = await saveAddress(user.business.id, Object.fromEntries(Object.entries(input).map(([k, v]) => [`a.${k}`, v])), "a");
  if (res.error || !res.address) return { ok: false, error: t("common.errors.validation") };
  revalidatePath("/checkout");
  return { ok: true, data: { id: res.address.id } };
}
