import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { requireUser } from "@/lib/auth/dal";
import { AccountShell } from "@/components/account/account-shell";
import { ProfileForm, PasswordForm } from "@/components/account/company-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.settings.title"), robots: { index: false } };
}

export default async function SettingsPage() {
  const [t, user] = await Promise.all([getT(), requireUser("/account/settings")]);
  return (
    <AccountShell user={user} title={t("account.settings.title")}>
      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-surface p-5"><h2 className="t-h4 mb-4">{t("account.settings.profile")}</h2><ProfileForm user={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone, locale: user.locale }} /></section>
        <section className="rounded-lg border border-border bg-surface p-5"><h2 className="t-h4 mb-4">{t("account.settings.password")}</h2><PasswordForm /></section>
        <section className="rounded-lg border border-border bg-paper p-5 text-sm"><h2 className="t-h4 mb-1">{t("account.settings.dangerZone")}</h2><p className="text-muted">{t("account.settings.deleteAccountDesc")}</p></section>
      </div>
    </AccountShell>
  );
}
