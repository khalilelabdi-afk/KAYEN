import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { getSettings } from "@/services/settings";
import { loadCheckout } from "@/components/checkout/checkout-guard";
import { CheckoutSteps } from "@/components/checkout/steps";
import { PaymentForm } from "@/components/checkout/payment-form";
import { OrderReview } from "@/components/checkout/order-review";
import { formatAddress } from "@/services/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("checkout.title")} — ${t("checkout.steps.payment")}`, robots: { index: false } };
}

export default async function CheckoutPaymentPage() {
  const [t, settings, { user, cart, billingAddress, shippingAddress, shipping }] = await Promise.all([getT(), getSettings(), loadCheckout("payment")]);
  const labels = [t("checkout.steps.information"), t("checkout.steps.shipping"), t("checkout.steps.payment"), t("checkout.steps.confirmation")];
  return (
    <div className="container-site py-8 md:py-10">
      <CheckoutSteps current={2} labels={labels} allowed={2} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <h1 className="t-h1 mb-6">{t("checkout.payment.title")}</h1>
          <dl className="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-4 text-sm sm:grid-cols-3">
            <div><dt className="text-muted">{t("checkout.information.billingAddress")}</dt><dd className="mt-0.5 font-medium">{formatAddress(billingAddress!)}</dd></div>
            <div><dt className="text-muted">{t("checkout.information.shippingAddress")}</dt><dd className="mt-0.5 font-medium">{formatAddress(shippingAddress!)}</dd></div>
            <div><dt className="text-muted">{t("checkout.shipping.title")}</dt><dd className="mt-0.5 font-medium">{shipping!.name}</dd></div>
          </dl>
          <PaymentForm total={cart.totals.total} invoiceAllowed={user.business.allowInvoicePay} invoiceDays={user.business.invoiceTermDays} cardProvider={process.env.PAYMENT_CARD_PROVIDER ?? "mock"} />
        </div>
        <OrderReview cart={cart} minimumOrderAmount={settings.minimumOrderAmount} />
      </div>
    </div>
  );
}
