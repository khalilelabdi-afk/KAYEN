import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { PromotionToggle, PromotionDeleteButton } from "@/components/admin/promotion-toggle";

function promotionValue(p: { type: string; valueBps: number | null; valueAmount: number | null; specialPrice: number | null; minQuantity: number | null }): string {
  const parts: string[] = [];
  if (p.valueBps !== null && (p.type === "PERCENTAGE" || p.type === "QUANTITY" || p.type === "BUNDLE")) parts.push(`-${(p.valueBps / 100).toLocaleString("fr-FR")} %`);
  if (p.valueAmount !== null && p.type === "FIXED_AMOUNT") parts.push(`-${formatMoney(p.valueAmount)}`);
  if (p.specialPrice !== null && (p.type === "SPECIAL_PRICE" || p.type === "CLEARANCE")) parts.push(formatMoney(p.specialPrice));
  if (p.minQuantity !== null) parts.push(`≥ ${p.minQuantity}`);
  return parts.join(" · ") || "—";
}

function isExpired(endsAt: Date | null): boolean {
  return endsAt !== null && endsAt.getTime() < Date.now();
}

export default async function AdminPromotionsPage() {
  const [t, promotions] = await Promise.all([getT(), db.promotion.findMany({ orderBy: [{ isActive: "desc" }, { priority: "desc" }, { createdAt: "desc" }], include: { _count: { select: { products: true, categories: true, brands: true, coupons: true } } } })]);
  const period =(p: { startsAt: Date | null; endsAt: Date | null }) => {
    if (p.startsAt && p.endsAt) return `${formatDate(p.startsAt)} → ${formatDate(p.endsAt)}`;
    if (p.startsAt) return t("admin.promotions.form.periodFrom", { date: formatDate(p.startsAt) });
    if (p.endsAt) return t("admin.promotions.form.periodUntil", { date: formatDate(p.endsAt) });
    return t("admin.promotions.form.periodNone");
  };
  return (
    <AdminShell title={`${t("admin.promotions.title")} (${promotions.length})`} actions={<Button asChild size="sm"><Link href="/admin/promotions/new"><Plus />{t("admin.promotions.create")}</Link></Button>}>
      <Table>
        <THead><TR><TH>{t("admin.promotions.columns.name")}</TH><TH>{t("admin.promotions.columns.type")}</TH><TH>{t("admin.promotions.columns.scope")}</TH><TH>{t("admin.promotions.columns.value")}</TH><TH>{t("admin.promotions.columns.period")}</TH><TH className="text-end">{t("admin.promotions.columns.uses")}</TH><TH>{t("admin.promotions.columns.active")}</TH><TH className="text-end">{t("common.labels.actions")}</TH></TR></THead>
        <TBody>
          {promotions.map((p) => {
            const expired = isExpired(p.endsAt);
            return (
              <TR key={p.id} className={!p.isActive || expired ? "opacity-70" : undefined}>
                <TD>
                  <Link href={`/admin/promotions/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                  <span className="block text-xs text-muted">{p.isAutomatic ? t("admin.promotions.form.isAutomatic") : `${p._count.coupons} ${t("admin.promotions.form.coupons").toLowerCase()}`}{p.scope !== "ORDER" && ` · ${t("admin.promotions.form.targetsSummary", { products: p._count.products, categories: p._count.categories, brands: p._count.brands })}`}</span>
                </TD>
                <TD className="text-xs">{t.enum("admin.promotions.form.types", p.type)}</TD>
                <TD className="text-xs">{t.enum("admin.promotions.form.scopes", p.scope)}</TD>
                <TD className="font-semibold tnum">{promotionValue(p)}</TD>
                <TD className="whitespace-nowrap text-xs">{period(p)}{expired && <Badge variant="muted" size="sm" className="ms-1">{t("common.status.quote.EXPIRED")}</Badge>}</TD>
                <TD className="text-end tnum">{p.maxUses ? t("admin.promotions.form.usesOf", { count: p.usesCount, max: p.maxUses }) : p.usesCount}</TD>
                <TD><PromotionToggle id={p.id} isActive={p.isActive} /></TD>
                <TD><span className="flex justify-end gap-0.5"><IconButton size="icon-sm" label={t("common.actions.edit")} asChild><Link href={`/admin/promotions/${p.id}`}><Pencil /></Link></IconButton><PromotionDeleteButton id={p.id} icon /></span></TD>
              </TR>
            );
          })}
          {!promotions.length && <TR><TD colSpan={8} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
    </AdminShell>
  );
}
