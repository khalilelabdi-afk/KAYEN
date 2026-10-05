import { LayoutTemplate } from "lucide-react";
import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import type { HomeSectionConfig } from "@/services/cms";
import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { HomeSectionsList, HomeInitButton } from "@/components/admin/home-sections";
import { HomeSectionAddButton, type HomeSectionRow } from "@/components/admin/home-section-dialog";

export default async function AdminHomepagePage() {
  const [t, rows] = await Promise.all([getT(), db.homeSection.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })]);
  const sections: HomeSectionRow[] = rows.map((r) => ({ id: r.id, type: r.type, title: r.title, subtitle: r.subtitle, ctaLabel: r.ctaLabel, ctaHref: r.ctaHref, image: r.image, isActive: r.isActive, sortOrder: r.sortOrder, config: (r.config as HomeSectionConfig | null) ?? {} }));
  return (
    <AdminShell title={t("admin.cms.homepage.title")} actions={<HomeSectionAddButton />}>
      <p className="mb-4 max-w-2xl text-sm text-muted">{t("admin.cms.homepage.desc")}</p>
      {sections.length ? (
        <HomeSectionsList sections={sections} />
      ) : (
        <EmptyState icon={<LayoutTemplate />} title={t("admin.cms.homepage.empty")} description={t("admin.cms.homepage.desc")} actions={<HomeInitButton />} />
      )}
    </AdminShell>
  );
}
