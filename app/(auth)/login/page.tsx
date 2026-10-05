import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent, RotateCcw, FileText, MapPin } from "lucide-react";
import { getT } from "@/i18n/server";
import { LoginForm } from "@/components/auth/auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.login.title"), robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [t, sp] = await Promise.all([getT(), searchParams]);
  const next = sp.next && sp.next.startsWith("/") ? sp.next : undefined;
  const benefits = [
    { icon: BadgePercent, text: t("auth.login.benefits.pricing") },
    { icon: RotateCcw, text: t("auth.login.benefits.reorder") },
    { icon: FileText, text: t("auth.login.benefits.quotes") },
    { icon: MapPin, text: t("auth.login.benefits.addresses") },
  ];
  return (
    <div className="container-site grid gap-10 py-10 md:grid-cols-2 md:gap-16 md:py-16 lg:grid-cols-[1fr_1.1fr]">
      <div className="order-2 md:order-1">
        <h2 className="t-h2">{t("auth.login.benefits.title")}</h2>
        <ul className="mt-6 space-y-4">
          {benefits.map((b) => (
            <li key={b.text} className="flex items-center gap-3 text-sm"><b.icon className="size-5 text-accent" aria-hidden />{b.text}</li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted">{t("auth.login.noAccount")} <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-foreground underline underline-offset-2">{t("auth.login.register")}</Link></p>
      </div>
      <div className="order-1 mx-auto w-full max-w-md rounded-xl border border-border bg-surface p-6 md:order-2 md:p-8">
        <h1 className="t-h1">{t("auth.login.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("auth.login.subtitle")}</p>
        <div className="mt-6"><LoginForm next={next} /></div>
      </div>
    </div>
  );
}
