import { getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { defaultSettings, mergeSettings } from "@/services/settings";
import { AdminShell } from "@/components/admin/admin-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingsContactForm, SettingsCommerceForm } from "@/components/admin/settings-forms";
import { SettingsShipping } from "@/components/admin/settings-shipping";
import { SettingsTaxes } from "@/components/admin/settings-taxes";

const TABS = ["contact", "commerce", "shipping", "taxes"] as const;

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [t, sp, rows, methods, taxes] = await Promise.all([
    getT(),
    searchParams,
    db.setting.findMany(),
    db.shippingMethod.findMany({ orderBy: [{ sortOrder: "asc" }, { code: "asc" }] }),
    db.taxClass.findMany({ orderBy: [{ isDefault: "desc" }, { code: "asc" }], include: { _count: { select: { products: true } } } }),
  ]);
  // Lecture directe (sans cache) pour afficher les valeurs réellement stockées.
  const settings = mergeSettings(defaultSettings, Object.fromEntries(rows.map((r) => [r.key, r.value])));
  const tab = TABS.find((x) => x === sp.tab) ?? "contact";
  return (
    <AdminShell title={t("admin.settings.title")}>
      <p className="mb-2 max-w-2xl text-sm text-muted">{t("admin.settings.desc")}</p>
      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="contact">{t("admin.settings.sections.contact")}</TabsTrigger>
          <TabsTrigger value="commerce">{t("admin.settings.sections.commerce")}</TabsTrigger>
          <TabsTrigger value="shipping">{t("admin.settings.sections.shipping")}</TabsTrigger>
          <TabsTrigger value="taxes">{t("admin.settings.sections.taxes")}</TabsTrigger>
        </TabsList>
        <TabsContent value="contact"><SettingsContactForm settings={{ supportEmail: settings.supportEmail, supportPhone: settings.supportPhone, supportHours: settings.supportHours, salesEmail: settings.salesEmail, companyAddress: settings.companyAddress }} /></TabsContent>
        <TabsContent value="commerce"><SettingsCommerceForm settings={{ freeShippingThreshold: settings.freeShippingThreshold, minimumOrderAmount: settings.minimumOrderAmount, quoteValidityDays: settings.quoteValidityDays, defaultLeadTime: settings.defaultLeadTime, taxIdLabel: settings.taxIdLabel, taxIdPlaceholder: settings.taxIdPlaceholder, taxDisplay: settings.taxDisplay, bankDetails: settings.bankDetails, returnPolicy: settings.returnPolicy, announcement: settings.announcement, newProductDays: settings.newProductDays }} /></TabsContent>
        <TabsContent value="shipping"><SettingsShipping methods={methods.map((m) => ({ id: m.id, code: m.code, name: m.name, description: m.description, price: m.price, freeAbove: m.freeAbove, minDays: m.minDays, maxDays: m.maxDays, countryCodes: m.countryCodes, isActive: m.isActive, sortOrder: m.sortOrder }))} /></TabsContent>
        <TabsContent value="taxes"><SettingsTaxes taxes={taxes.map((x) => ({ id: x.id, code: x.code, name: x.name, rateBps: x.rateBps, isDefault: x.isDefault, productCount: x._count.products }))} /></TabsContent>
      </Tabs>
    </AdminShell>
  );
}
