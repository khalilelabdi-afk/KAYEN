import { getT } from "@/i18n/server";
import { db, type Prisma } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterBar, FilterSelect, AdminPagination, StatCard } from "@/components/admin/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { InventoryRow, type InventoryRowData } from "@/components/admin/inventory-panels";

const FILTERS = ["all", "low", "out"] as const;
const PAGE = 50;

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const filter = FILTERS.find((f) => f === sp.filter) ?? "all";
  const [lowRows, outRows] = await Promise.all([
    db.$queryRaw<{ variantId: string }[]>`SELECT i."variantId" FROM "Inventory" i JOIN "ProductVariant" v ON v.id = i."variantId" JOIN "Product" p ON p.id = v."productId" WHERE p.status <> 'ARCHIVED' AND i.quantity - i.reserved > 0 AND i.quantity - i.reserved <= i."lowStockThreshold"`,
    db.$queryRaw<{ variantId: string }[]>`SELECT i."variantId" FROM "Inventory" i JOIN "ProductVariant" v ON v.id = i."variantId" JOIN "Product" p ON p.id = v."productId" WHERE p.status <> 'ARCHIVED' AND i.quantity - i.reserved <= 0`,
  ]);
  const lowIds = lowRows.map((r) => r.variantId);
  const outIds = outRows.map((r) => r.variantId);
  const where: Prisma.ProductVariantWhereInput = {
    product: { status: { not: "ARCHIVED" } },
    ...(sp.q ? { OR: [{ sku: { contains: sp.q, mode: "insensitive" } }, { product: { name: { contains: sp.q, mode: "insensitive" } } }] } : {}),
    ...(filter === "low" ? { id: { in: lowIds } } : filter === "out" ? { OR: [{ id: { in: outIds } }, { inventory: null }] } : {}),
  };
  const [total, variants] = await Promise.all([
    db.productVariant.count({ where }),
    db.productVariant.findMany({ where, orderBy: [{ product: { name: "asc" } }, { position: "asc" }], skip: (page - 1) * PAGE, take: PAGE, include: { product: { select: { id: true, name: true } }, inventory: true } }),
  ]);
  const rows: InventoryRowData[] = variants.map((v) => ({ variantId: v.id, productId: v.product.id, productName: v.product.name, sku: v.sku, variantName: v.name, quantity: v.inventory?.quantity ?? 0, reserved: v.inventory?.reserved ?? 0, threshold: v.inventory?.lowStockThreshold ?? 0, allowBackorder: v.inventory?.allowBackorder ?? false, isActive: v.isActive }));
  const totalPages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <AdminShell title={`${t("admin.inventory.title")} (${total})`}>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("admin.inventory.filters.low")} value={String(lowIds.length)} href="/admin/inventory?filter=low" tone={lowIds.length ? "warning" : undefined} />
        <StatCard label={t("admin.inventory.filters.out")} value={String(outIds.length)} href="/admin/inventory?filter=out" tone={outIds.length ? "warning" : undefined} />
      </div>
      <FilterBar searchValue={sp.q} searchPlaceholder={t("admin.table.search")} submitLabel={t("common.actions.filter")}>
        <FilterSelect name="filter" value={filter === "all" ? "" : filter} allLabel={t("admin.inventory.filters.all")} label={t("admin.inventory.filter")} options={[{ value: "low", label: t("admin.inventory.filters.low") }, { value: "out", label: t("admin.inventory.filters.out") }]} />
      </FilterBar>
      <Table>
        <THead><TR><TH>{t("admin.inventory.columns.product")}</TH><TH>{t("admin.inventory.columns.sku")}</TH><TH className="text-end">{t("admin.inventory.columns.quantity")}</TH><TH className="text-end">{t("admin.inventory.columns.reserved")}</TH><TH className="text-end">{t("admin.inventory.columns.threshold")}</TH><TH>{t("admin.inventory.columns.status")}</TH><TH className="text-end">{t("common.labels.actions")}</TH></TR></THead>
        <TBody>
          {rows.map((r) => <InventoryRow key={r.variantId} row={r} />)}
          {!rows.length && <TR><TD colSpan={7} className="py-8 text-center text-muted">{t("admin.table.noResults")}</TD></TR>}
        </TBody>
      </Table>
      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/inventory" params={{ q: sp.q, filter: sp.filter }} labels={{ previous: t("common.actions.previous"), next: t("common.actions.next"), page: t("common.labels.page", { page, total: totalPages }) }} />
    </AdminShell>
  );
}
