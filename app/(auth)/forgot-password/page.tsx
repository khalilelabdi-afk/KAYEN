import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { ForgotPasswordForm } from "@/components/auth/auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.forgot.title"), robots: { index: false } };
}

export default async function ForgotPasswordPage() {
  const t = await getT();
  return (
    <div className="container-site py-10 md:py-16">
      <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-surface p-6 md:p-8">
        <h1 className="t-h1">{t("auth.forgot.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("auth.forgot.desc")}</p>
        <div className="mt-6"><ForgotPasswordForm /></div>
        <p className="mt-6 text-center text-sm"><Link href="/login" className="text-muted underline underline-offset-2 hover:text-foreground">{t("auth.forgot.back")}</Link></p>
      </div>
    </div>
  );
}
