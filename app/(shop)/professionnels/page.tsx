import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { getSectors } from "@/services/catalog/sectors";
import { SectorsSection } from "@/components/home/sectors";
import { Section } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("catalog.sectors.title"), description: t("catalog.sectors.desc"), alternates: { canonical: "/professionnels" } };
}

export default async function SectorsIndexPage() {
  const [t, sectors] = await Promise.all([getT(), getSectors()]);
  return (
    <>
      <Section className="pb-0 pt-6 md:pb-0 md:pt-10">
        <Breadcrumb items={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("catalog.sectors.title") }]} label={t("common.breadcrumb.label")} className="mb-4" />
        <h1 className="t-h1">{t("catalog.sectors.title")}</h1>
        <p className="mt-3 max-w-2xl text-muted">{t("catalog.sectors.desc")}</p>
      </Section>
      <SectorsSection sectors={sectors} title={t("catalog.sectors.allSectors")} subtitle={null} limit={50} />
    </>
  );
}
