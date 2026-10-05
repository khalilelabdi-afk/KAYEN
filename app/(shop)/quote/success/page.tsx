import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";

export default async function QuoteSuccessPage({ searchParams }: { searchParams: Promise<{ number?: string }> }) {
  const [t, sp, user] = await Promise.all([getT(), searchParams, getCurrentUser()]);
  return (
    <Section>
      <div className="mx-auto max-w-lg text-center">
        <CheckCircle2 className="mx-auto size-12 text-accent" aria-hidden />
        <h1 className="t-h1 mt-4">{t("quote.success.title")}</h1>
        <p className="mt-3 text-muted">{t("quote.success.desc", { number: sp.number ?? "" })}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? <Button asChild><Link href="/account/quotes">{t("quote.success.track")}</Link></Button> : <Button asChild><Link href="/register">{t("common.actions.register")}</Link></Button>}
          <Button asChild variant="outline"><Link href="/c">{t("quote.success.continue")}</Link></Button>
        </div>
        {!user && <p className="mt-6 text-sm text-muted">{t("quote.success.registerHint")}</p>}
      </div>
    </Section>
  );
}
