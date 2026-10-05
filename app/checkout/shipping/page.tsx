import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { getSettings, getShippingMethods } from "@/services/settings";
import { loadCheckout } from "@/components/checkout/checkout-guard";
import { CheckoutSteps } from "@/components/checkout/steps";
import { ShippingForm } from "@/components/checkout/shipping-form";
import { OrderReview } from "@/components/checkout/order-review";
import { formatAddress } from "@/services/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("checkout.title")} — ${t("checkout.steps.shipping")}`, robots: { index: false } };
}

export default async function CheckoutShippingPage() {
  const [t, settings, methods, { state, cart, shippingAddress }] = await Promise.all([getT(), getSettings(), getShippingMethods(), loadCheckout("shipping")]);
  const net = cart.totals.subtotal - cart.totals.discountTotal;
  const options = methods
    .filter((m) => m.countryCodes.length === 0 || m.countryCodes.includes(shippingAddress!.countryCode))
    .map((m) => {
      const threshold = m.freeAbove ?? settings.freeShippingThreshold;
      return { code: m.code, name: m.name, description: m.description, price: m.price, isFree: threshold !== null && threshold > 0 && net >= threshold, minDays: m.minDays, maxDays: m.maxDays };
    });
  const labels = [t("checkout.steps.information"), t("checkout.steps.shipping"), t("checkout.steps.payment"), t("checkout.steps.confirmation")];
  return (
    <div className="container-site py-8 md:py-10">
      <CheckoutSteps current={1} labels={labels} allowed={state.shippingMethodCode ? 2 : 1} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <h1 className="t-h1 mb-2">{t("checkout.shipping.title")}</h1>
          <p className="mb-6 text-sm text-muted">{t("checkout.information.shippingAddress")} : {formatAddress(shippingAddress!)}</p>
          <ShippingForm methods={options} selected={state.shippingMethodCode} />
        </div>
        <OrderReview cart={cart} minimumOrderAmount={settings.minimumOrderAmount} />
      </div>
    </div>
  );
}
