import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { getSettings } from "@/services/settings";
import { loadCheckout } from "@/components/checkout/checkout-guard";
import { CheckoutSteps } from "@/components/checkout/steps";
import { InformationForm } from "@/components/checkout/information-form";
import { OrderReview } from "@/components/checkout/order-review";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("checkout.title")} — ${t("checkout.steps.information")}`, robots: { index: false } };
}

export default async function CheckoutInformationPage() {
  const [t, settings, { user, state, cart }] = await Promise.all([getT(), getSettings(), loadCheckout("information")]);
  const addresses = await db.address.findMany({ where: { businessId: user.business.id }, orderBy: [{ isDefaultBilling: "desc" }, { createdAt: "asc" }] });
  const labels = [t("checkout.steps.information"), t("checkout.steps.shipping"), t("checkout.steps.payment"), t("checkout.steps.confirmation")];
  return (
    <div className="container-site py-8 md:py-10">
      <CheckoutSteps current={0} labels={labels} allowed={state.shippingMethodCode ? 2 : state.shippingAddressId ? 1 : 0} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <h1 className="t-h1 mb-6">{t("checkout.information.title")}</h1>
          <InformationForm addresses={addresses.map((a) => ({ id: a.id, label: a.label, company: a.company, line1: a.line1, line2: a.line2, postalCode: a.postalCode, city: a.city, countryCode: a.countryCode, isDefaultBilling: a.isDefaultBilling, isDefaultShipping: a.isDefaultShipping }))} state={state} company={user.business.name} contact={{ name: user.fullName, email: user.email, phone: user.phone }} />
        </div>
        <OrderReview cart={cart} minimumOrderAmount={settings.minimumOrderAmount} />
      </div>
    </div>
  );
}
