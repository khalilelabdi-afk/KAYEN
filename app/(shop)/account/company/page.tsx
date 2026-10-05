import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { requireUser, canManageBusiness } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { getSectors } from "@/services/catalog/sectors";
import { getSettings } from "@/services/settings";
import { AccountShell } from "@/components/account/account-shell";
import { StatusBadge } from "@/components/ui/badge";
import { CompanyForm } from "@/components/account/company-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.company.title"), robots: { index: false } };
}

export default async function CompanyPage() {
  const [t, user, sectors, settings] = await Promise.all([getT(), requireUser("/account/company"), getSectors(), getSettings()]);
  const business = user.business ? await db.business.findUnique({ where: { id: user.business.id }, include: { customerGroup: true } }) : null;
  return (
    <AccountShell user={user} title={t("account.company.title")}>
      <p className="mb-6 text-sm text-muted">{t("account.company.desc")}</p>
      {business && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-lg border border-border bg-surface p-5">
            <CompanyForm company={business} sectors={sectors.map((s) => ({ id: s.id, name: s.name }))} taxIdLabel={settings.taxIdLabel} readOnly={!canManageBusiness(user)} />
          </div>
          <aside className="space-y-4 text-sm">
            <div className="rounded-lg border border-border bg-surface p-4"><p className="t-label text-muted">{t("account.company.status")}</p><div className="mt-2"><StatusBadge status={business.status} label={t.enum("common.status.business", business.status)} /></div></div>
            <div className="rounded-lg border border-border bg-surface p-4"><p className="t-label text-muted">{t("account.company.group")}</p><p className="mt-2 font-medium">{business.customerGroup?.name ?? t("account.company.groupDefault")}</p></div>
            <div className="rounded-lg border border-border bg-surface p-4"><p className="t-label text-muted">{t("account.company.invoicePayment")}</p><p className="mt-2">{business.allowInvoicePay ? t("account.company.invoiceEnabled", { days: business.invoiceTermDays }) : t("account.company.invoiceDisabled")}</p></div>
          </aside>
        </div>
      )}
    </AccountShell>
  );
}
