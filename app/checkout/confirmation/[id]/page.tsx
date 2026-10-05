import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireBusinessUser } from "@/lib/auth/dal";
import { getBusinessOrder } from "@/services/orders";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { CheckoutSteps } from "@/components/checkout/steps";
import { PurchaseTracker } from "@/components/checkout/purchase-tracker";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("checkout.confirmation.title"), robots: { index: false } };
}

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, user] = await Promise.all([params, getT(), requireBusinessUser("/checkout")]);
  const order = await getBusinessOrder(user.business.id, id);
  if (!order) notFound();
  const labels = [t("checkout.steps.information"), t("checkout.steps.shipping"), t("checkout.steps.payment"), t("checkout.steps.confirmation")];
  return (
    <div className="container-site py-8 md:py-10">
      <PurchaseTracker id={order.number} total={order.total} items={order.items.length} />
      <CheckoutSteps current={3} labels={labels} allowed={3} />
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 text-center md:p-10">
        <CheckCircle2 className="mx-auto size-12 text-accent" aria-hidden />
        <h1 className="t-h1 mt-4">{t("checkout.confirmation.title")}</h1>
        <p className="mt-2 text-lg font-semibold">{t("checkout.confirmation.subtitle", { number: order.number })}</p>
        <p className="mt-3 text-muted">{t("checkout.confirmation.desc", { email: user.email })}</p>
        {order.paymentMethod === "BANK_TRANSFER" && <p className="mt-4 rounded-md bg-info-soft px-4 py-3 text-sm text-info">{t("checkout.confirmation.bankTransferInfo", { amount: formatMoney(order.total), number: order.number })}</p>}
        {order.paymentMethod === "INVOICE" && <p className="mt-4 rounded-md bg-info-soft px-4 py-3 text-sm text-info">{t("checkout.confirmation.invoiceInfo", { days: user.business.invoiceTermDays })}</p>}
        <div className="mt-8 text-start">
          <p className="t-label text-muted">{t("checkout.confirmation.nextSteps")}</p>
          <ol className="mt-3 space-y-2 text-sm">
            {[t("checkout.confirmation.step1"), t("checkout.confirmation.step2"), t("checkout.confirmation.step3")].map((s, i) => (
              <li key={i} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-paper-2 text-xs font-semibold">{i + 1}</span>{s}</li>
            ))}
          </ol>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link href={`/account/orders/${order.id}`}>{t("checkout.confirmation.viewOrder")}</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/c">{t("checkout.confirmation.continue")}</Link></Button>
        </div>
      </div>
    </div>
  );
}
