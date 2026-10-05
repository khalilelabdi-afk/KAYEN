import Link from "next/link";
import { Mail, Phone, Clock } from "lucide-react";
import { getT } from "@/i18n/server";
import { LogoMark } from "./logo";
import type { CommerceSettings } from "@/services/settings";

export async function Footer({ settings }: { settings: CommerceSettings }) {
  const t = await getT();
  const year = new Date().getFullYear();
  const columns = [
    {
      title: t("nav.footer.shop"),
      links: [
        { label: t("nav.footer.categories"), href: "/c" },
        { label: t("nav.footer.brands"), href: "/brands" },
        { label: t("nav.footer.newArrivals"), href: "/nouveautes" },
        { label: t("nav.footer.promotions"), href: "/promotions" },
        { label: t("nav.footer.quickOrder"), href: "/quick-order" },
      ],
    },
    {
      title: t("nav.footer.kayen"),
      links: [
        { label: t("nav.footer.about"), href: "/about" },
        { label: t("nav.footer.sectors"), href: "/professionnels" },
        { label: t("nav.footer.contact"), href: "/contact" },
        { label: t("nav.footer.guides"), href: "/guides" },
      ],
    },
    {
      title: t("nav.footer.help"),
      links: [
        { label: t("nav.footer.delivery"), href: "/pages/livraison" },
        { label: t("nav.footer.payment"), href: "/pages/paiement" },
        { label: t("nav.footer.returns"), href: "/pages/retours" },
        { label: t("nav.footer.faq"), href: "/faq" },
      ],
    },
    {
      title: t("nav.footer.account"),
      links: [
        { label: t("nav.footer.login"), href: "/login" },
        { label: t("nav.footer.orders"), href: "/account/orders" },
        { label: t("nav.footer.quotes"), href: "/account/quotes" },
        { label: t("nav.footer.lists"), href: "/account/lists" },
      ],
    },
  ];
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-site py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)] md:gap-8">
          <div className="max-w-xs">
            <LogoMark />
            <p className="mt-3 text-sm text-muted">{t("nav.footer.description")}</p>
            <div className="mt-6 space-y-2 text-sm">
              <p className="t-label text-muted">{t("nav.footer.contactTitle")}</p>
              <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2 text-foreground/85 hover:text-foreground"><Mail className="size-4 text-muted" aria-hidden />{settings.supportEmail}</a>
              <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-foreground/85 hover:text-foreground"><Phone className="size-4 text-muted" aria-hidden />{settings.supportPhone}</a>
              <p className="flex items-center gap-2 text-muted"><Clock className="size-4" aria-hidden />{settings.supportHours}</p>
            </div>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="t-label text-foreground">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted transition-colors hover:text-foreground">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>{t("nav.footer.copyright", { year })}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li><Link href="/pages/mentions-legales" className="hover:text-foreground">{t("nav.footer.legal")}</Link></li>
            <li><Link href="/pages/confidentialite" className="hover:text-foreground">{t("nav.footer.privacy")}</Link></li>
            <li><Link href="/pages/cgv" className="hover:text-foreground">{t("nav.footer.terms")}</Link></li>
            <li><Link href="/pages/cookies" className="hover:text-foreground">{t("nav.footer.cookies")}</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
