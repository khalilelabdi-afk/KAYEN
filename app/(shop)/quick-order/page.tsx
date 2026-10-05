import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Section } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { QuickOrderForm } from "@/components/cart/quick-order-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.quickOrder.title"), description: t("account.quickOrder.desc"), alternates: { canonical: "/quick-order" } };
}

export default async function QuickOrderPage() {
  const t = await getT();
  return (
    <Section className="py-6 md:py-10">
      <Breadcrumb items={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("account.quickOrder.title") }]} label={t("common.breadcrumb.label")} className="mb-4" />
      <h1 className="t-h1">{t("account.quickOrder.title")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t("account.quickOrder.desc")}</p>
      <div className="mt-8 max-w-3xl"><QuickOrderForm /></div>
    </Section>
  );
}
