import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { toMoneyInput } from "@/lib/money";
import { AdminShell } from "@/components/admin/admin-shell";
import { PromotionForm, type PromotionFormInitial } from "@/components/admin/promotion-form";
import { PromotionDeleteButton } from "@/components/admin/promotion-toggle";
import { loadPromotionRefs } from "../queries";

const iso = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "");
const str = (n: number | null) => (n === null ? "" : String(n));
const money = (n: number | null) => (n === null ? "" : toMoneyInput(n));

export default async function AdminPromotionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const [promo, refs] = await Promise.all([db.promotion.findUnique({ where: { id }, include: { products: { include: { product: { select: { sku: true } } } }, categories: true, brands: true, coupons: { orderBy: { createdAt: "asc" } } } }), loadPromotionRefs()]);
  if (!promo) notFound();
  const initial: PromotionFormInitial = {
    id: promo.id, name: promo.name, description: promo.description ?? "", type: promo.type, scope: promo.scope,
    valueBps: promo.valueBps === null ? "" : (promo.valueBps / 100).toString(), valueAmount: money(promo.valueAmount), specialPrice: money(promo.specialPrice), minQuantity: str(promo.minQuantity), minOrderAmount: money(promo.minOrderAmount),
    isAutomatic: promo.isAutomatic, isActive: promo.isActive, startsAt: iso(promo.startsAt), endsAt: iso(promo.endsAt), maxUses: str(promo.maxUses), maxUsesPerCustomer: str(promo.maxUsesPerCustomer), customerGroupId: promo.customerGroupId ?? "", priority: String(promo.priority), showBadge: promo.showBadge, badgeLabel: promo.badgeLabel ?? "",
    productSkus: promo.products.map((p) => p.product.sku).join("\n"), categoryIds: promo.categories.map((c) => c.categoryId), brandIds: promo.brands.map((b) => b.brandId),
    coupons: promo.coupons.map((c) => ({ key: c.id, code: c.code, maxUses: str(c.maxUses), isActive: c.isActive, startsAt: iso(c.startsAt), endsAt: iso(c.endsAt), usesCount: c.usesCount })),
  };
  return (
    <AdminShell title={promo.name} breadcrumb={[{ label: t("admin.nav.promotions"), href: "/admin/promotions" }, { label: promo.name }]} actions={<PromotionDeleteButton id={promo.id} />}>
      <PromotionForm key={promo.updatedAt.toISOString()} initial={initial} refs={refs} />
    </AdminShell>
  );
}
