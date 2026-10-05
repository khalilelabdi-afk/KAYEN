import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { getT } from "@/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="container-site flex h-16 items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm text-muted hover:text-foreground">{t("common.actions.backToHome")}</Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
