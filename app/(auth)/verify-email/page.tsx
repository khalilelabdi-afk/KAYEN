import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { getT } from "@/i18n/server";
import { verifyEmail } from "@/services/auth";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.verify.title"), robots: { index: false } };
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const ok = sp.token ? await verifyEmail(sp.token) : false;
  return (
    <div className="container-site py-16">
      <div className="mx-auto max-w-md text-center">
        {ok ? <CheckCircle2 className="mx-auto size-12 text-accent" aria-hidden /> : <XCircle className="mx-auto size-12 text-error" aria-hidden />}
        <h1 className="t-h1 mt-4">{t("auth.verify.title")}</h1>
        <p className="mt-3 text-muted">{ok ? t("auth.verify.success") : t("auth.verify.invalid")}</p>
        <div className="mt-8"><Button asChild><Link href={ok ? "/account" : "/login"}>{ok ? t("account.title") : t("common.actions.login")}</Link></Button></div>
      </div>
    </div>
  );
}
