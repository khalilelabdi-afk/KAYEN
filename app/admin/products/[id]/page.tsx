import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/ui/badge";
import { ProductForm } from "@/components/admin/product-form";
import { ProductActions } from "@/components/admin/product-list-actions";
import { productToFormState } from "@/components/admin/product-form-types";
import { loadProductRefs, productFormInclude } from "../queries";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const [product, refs] = await Promise.all([db.product.findUnique({ where: { id }, include: productFormInclude }), loadProductRefs()]);
  if (!product) notFound();
  return (
    <AdminShell
      title={product.name}
      breadcrumb={[{ label: t("admin.nav.products"), href: "/admin/products" }, { label: product.sku }]}
      actions={<><span className="flex items-center gap-2 text-xs text-muted"><StatusBadge status={product.status} label={t.enum("common.status.product", product.status)} className="text-sm" />{t("admin.common.updatedAt")} {formatDateTime(product.updatedAt)}</span><ProductActions id={product.id} status={product.status} slug={product.slug} variant="header" /></>}
    >
      <ProductForm key={product.updatedAt.toISOString()} initial={productToFormState(product)} refs={refs} />
    </AdminShell>
  );
}
