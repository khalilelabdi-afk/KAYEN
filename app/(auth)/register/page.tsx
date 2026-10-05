import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { getSectors } from "@/services/catalog/sectors";
import { getSettings } from "@/services/settings";
import { RegisterForm } from "@/components/auth/auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.register.title"), robots: { index: false } };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [t, sectors, settings, sp] = await Promise.all([getT(), getSectors(), getSettings(), searchParams]);
  const next = sp.next && sp.next.startsWith("/") ? sp.next : undefined;
  return (
    <div className="container-site py-10 md:py-16">
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 md:p-10">
        <h1 className="t-h1">{t("auth.register.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("auth.register.subtitle")}</p>
        <div className="mt-8">
          <RegisterForm sectors={sectors.map((s) => ({ id: s.id, name: s.name }))} taxIdLabel={settings.taxIdLabel} taxIdPlaceholder={settings.taxIdPlaceholder} next={next} />
        </div>
        <p className="mt-6 text-center text-sm text-muted">{t("auth.register.haveAccount")} <Link href="/login" className="font-semibold text-foreground underline underline-offset-2">{t("auth.register.login")}</Link></p>
      </div>
    </div>
  );
}
