import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterBar, FilterSelect, AdminPagination } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductActions } from "@/components/admin/product-list-actions";
import { loadCategoryOptions } from "./queries";

const STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
const STOCK_STATES = ["ok", "low", "out"] as const;
const PAGE = 30;
type StockState = (typeof STOCK_STATES)[number];
const stockTone: Record<StockState, "success" | "warning" | "error"> = { ok: "success", low: "warning", out: "error" };

/** État de stock agrégé par produit (disponible = quantité − réservé, sommé sur les variantes actives). */
async function stockFilter(state: StockState): Promise<Prisma.ProductWhereInput> {
  const rows = await db.$queryRaw<{ id: string; available: number; low: boolean }[]>`
    SELECT v."productId" AS id, COALESCE(SUM(i.quantity - i.reserved), 0)::int AS available, COALESCE(bool_or(i.quantity - i.reserved <= i."lowStockThreshold"), true) AS low
    FROM "ProductVariant" v LEFT JOIN "Inventory" i ON i."variantId" = v.id WHERE v."isActive" = true GROUP BY v."productId"`;
  const out = rows.filter((r) => r.available <= 0).map((r) => r.id);
  const low = rows.filter((r) => r.available > 0 && r.low).map((r) => r.id);
  if (state === "out") return { OR: [{ id: { in: out } }, { variants: { none: { isActive: true } } }] };
  if (state === "low") return { id: { in: low } };
  return { id: { notIn: [...out, ...low] }, variants: { some: { isActive: true } } };
}

function productStock(variants: { isActive: boolean; inventory: { quantity: number; reserved: number; lowStockThreshold: number } | null }[]): { available: number; state: StockState } {
  const active = variants.filter((v) => v.isActive);
  const available = active.reduce((s, v) => s + Math.max(0, (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0)), 0);
  if (!active.length || available <= 0) return { available, state: "out" };
  const low = active.some((v) => (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) <= (v.inventory?.lowStockThreshold ?? 0));
  return { available, state: low ? "low" : "ok" };
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string; brand?: string; stock?: string; page?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const stock = STOCK_STATES.find((s) => s === sp.stock);
  const where: Prisma.ProductWhereInput = {
    ...(STATUSES.find((s) => s === sp.status) ? { status: sp.status as "DRAFT" } : {}),
    ...(sp.category ? { categoryId: sp.category } : {}),
    ...(sp.brand ? { brandId: sp.brand } : {}),
    ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { sku: { contains: sp.q, mode: "insensitive" } }, { variants: { some: { sku: { contains: sp.q, mode: "insensitive" } } } }] } : {}),
    ...(stock ? await stockFilter(stock) : {}),
  };
  const [total, products, categories, brands] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({ where, orderBy: [{ updatedAt: "desc" }], skip: (page - 1) * PAGE, take: PAGE, include: { category: { select: { name: true } }, brand: { select: { name: true } }, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } }, variants: { select: { isActive: true, inventory: { select: { quantity: true, reserved: true, lowStockThreshold: true } } } }, _count: { select: { variants: true } } } }),
    loadCategoryOptions(),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE));
  const params = { q: sp.q, status: sp.status, category: sp.category, brand: sp.brand, stock: sp.stock };
  return (
    <AdminShell title={`${t("admin.products.title")} (${total})`} actions={<Button asChild size="sm"><Link href="/admin/products/new"><Plus />{t("admin.products.create")}</Link></Button>}>
      <FilterBar searchValue={sp.q} searchPlaceholder={t("admin.table.search")} submitLabel={t("common.actions.filter")}>
        <FilterSelect name="status" value={sp.status} allLabel={t("admin.common.all")} label={t("admin.products.filters.status")} options={STATUSES.map((s) => ({ value: s, label: t.enum("common.status.product", s) }))} />
        <FilterSelect name="category" value={sp.category} allLabel={t("admin.common.all")} label={t("admin.products.filters.category")} options={categories.map((c) => ({ value: c.id, label: `${"  ".repeat(c.level)}${c.name}` }))} />
        <FilterSelect name="brand" value={sp.brand} allLabel={t("admin.common.all")} label={t("admin.products.filters.brand")} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
        <FilterSelect name="stock" value={sp.stock} allLabel={t("admin.common.all")} label={t("admin.products.filters.stock")} options={STOCK_STATES.map((s) => ({ value: s, label: t.enum("admin.inventory.status", s) }))} />
      </FilterBar>
      <Table>
        <THead><TR><TH>{t("admin.products.columns.product")}</TH><TH>{t("admin.products.columns.sku")}</TH><TH>{t("admin.products.columns.category")}</TH><TH>{t("admin.products.columns.brand")}</TH><TH className="text-end">{t("admin.products.columns.price")}</TH><TH className="text-end">{t("admin.products.columns.stock")}</TH><TH>{t("admin.products.columns.status")}</TH><TH className="text-end">{t("admin.products.columns.sales")}</TH><TH className="text-end">{t("common.labels.actions")}</TH></TR></THead>
        <TBody>
          {products.map((p) => {
            const s = productStock(p.variants);
            return (
              <TR key={p.id}>
                <TD>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:underline">
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-paper-2">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" unoptimized />}</span>
                    <span className="line-clamp-2 font-medium">{p.name}</span>
                  </Link>
                </TD>
                <TD className="font-mono text-xs">{p.sku}{p._count.variants > 1 && <span className="block text-muted">{t("admin.products.variantsCount", { count: p._count.variants })}</span>}</TD>
                <TD className="text-xs">{p.category.name}</TD>
                <TD className="text-xs">{p.brand?.name ?? "—"}</TD>
                <TD className="text-end font-semibold tnum">{formatMoney(p.priceFrom)}</TD>
                <TD className="text-end"><span className="tnum">{s.available}</span> <Badge variant={stockTone[s.state]} size="sm">{t.enum("admin.inventory.status", s.state)}</Badge></TD>
                <TD><StatusBadge status={p.status} label={t.enum("common.status.product", p.status)} /></TD>
                <TD className="text-end tnum">{p.salesCount}</TD>
                <TD><ProductActions id={p.id} status={p.status} slug={p.slug} /></TD>
              </TR>
            );
          })}
          {!products.length && <TR><TD colSpan={9} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/products" params={params} labels={{ previous: t("common.actions.previous"), next: t("common.actions.next"), page: t("common.labels.page", { page, total: totalPages }) }} />
    </AdminShell>
  );
}
