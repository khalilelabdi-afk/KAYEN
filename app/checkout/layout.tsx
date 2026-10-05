import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getT } from "@/i18n/server";
import { Logo } from "@/components/layout/logo";

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="container-site flex h-16 items-center justify-between">
          <Logo />
          <p className="hidden items-center gap-1.5 text-xs text-muted sm:flex"><ShieldCheck className="size-4 text-accent" aria-hidden />{t("checkout.payment.secure")}</p>
          <Link href="/cart" className="text-sm text-muted hover:text-foreground">{t("cart.title")}</Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
