import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { ResetPasswordForm } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.reset.title"), robots: { index: false } };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  return (
    <div className="container-site py-10 md:py-16">
      <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-surface p-6 md:p-8">
        <h1 className="t-h1">{t("auth.reset.title")}</h1>
        <div className="mt-6">
          {sp.token ? <ResetPasswordForm token={sp.token} /> : (
            <div className="space-y-4">
              <p className="text-sm text-error">{t("auth.reset.invalid")}</p>
              <Button asChild variant="outline"><Link href="/forgot-password">{t("auth.forgot.title")}</Link></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
