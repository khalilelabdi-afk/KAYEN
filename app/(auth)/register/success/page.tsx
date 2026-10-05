import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getT } from "@/i18n/server";
import { requireUser } from "@/lib/auth/dal";
import { Button } from "@/components/ui/button";

export default async function RegisterSuccessPage() {
  const [t, user] = await Promise.all([getT(), requireUser("/register")]);
  return (
    <div className="container-site py-16">
      <div className="mx-auto max-w-lg text-center">
        <CheckCircle2 className="mx-auto size-12 text-accent" aria-hidden />
        <h1 className="t-h1 mt-4">{t("auth.register.success.title")}</h1>
        <p className="mt-3 text-muted">{t("auth.register.success.desc")}</p>
        {!user.emailVerified && <p className="mt-3 rounded-md bg-info-soft px-3 py-2 text-sm text-info">{t("auth.verify.pendingBanner", { email: user.email })}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link href="/c">{t("auth.register.success.cta")}</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/account">{t("auth.register.success.account")}</Link></Button>
        </div>
      </div>
    </div>
  );
}
