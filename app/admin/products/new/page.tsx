import { getT } from "@/i18n/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { loadProductRefs } from "../queries";

export default async function AdminProductNewPage() {
  const [t, refs] = await Promise.all([getT(), loadProductRefs()]);
  return (
    <AdminShell title={t("admin.products.create")} breadcrumb={[{ label: t("admin.nav.products"), href: "/admin/products" }, { label: t("admin.products.create") }]}>
      <ProductForm refs={refs} />
    </AdminShell>
  );
}
