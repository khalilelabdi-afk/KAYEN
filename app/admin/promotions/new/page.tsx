import { getT } from "@/i18n/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { PromotionForm } from "@/components/admin/promotion-form";
import { loadPromotionRefs } from "../queries";

export default async function AdminPromotionNewPage() {
  const [t, refs] = await Promise.all([getT(), loadPromotionRefs()]);
  return (
    <AdminShell title={t("admin.promotions.create")} breadcrumb={[{ label: t("admin.nav.promotions"), href: "/admin/promotions" }, { label: t("admin.promotions.create") }]}>
      <PromotionForm refs={refs} />
    </AdminShell>
  );
}
