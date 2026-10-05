import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, Clock, MapPin, FileText, Package, Briefcase } from "lucide-react";
import { getT } from "@/i18n/server";
import { getSettings } from "@/services/settings";
import { Section } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/cms/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("cms.contact.title"), description: t("cms.contact.subtitle"), alternates: { canonical: "/contact" } };
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const [t, settings, sp] = await Promise.all([getT(), getSettings(), searchParams]);
  return (
    <Section className="py-6 md:py-10">
      <Breadcrumb items={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("cms.contact.title") }]} label={t("common.breadcrumb.label")} className="mb-4" />
      <h1 className="t-h1">{t("cms.contact.title")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t("cms.contact.subtitle")}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { icon: Briefcase, title: t("cms.contact.sales.title"), desc: t("cms.contact.sales.desc"), email: settings.salesEmail },
          { icon: Package, title: t("cms.contact.orders.title"), desc: t("cms.contact.orders.desc"), email: settings.supportEmail },
        ].map((c) => (
          <div key={c.title} className="rounded-lg border border-border bg-surface p-5">
            <c.icon className="size-5 text-accent" aria-hidden />
            <p className="mt-3 font-semibold">{c.title}</p>
            <p className="mt-1 text-sm text-muted">{c.desc}</p>
            <a href={`mailto:${c.email}`} className="mt-3 inline-block text-sm font-medium underline underline-offset-2">{c.email}</a>
          </div>
        ))}
        <div className="rounded-lg bg-accent p-5 text-white">
          <FileText className="size-5" aria-hidden />
          <p className="mt-3 font-semibold">{t("cms.contact.quote.title")}</p>
          <p className="mt-1 text-sm text-white/85">{t("cms.contact.quote.desc")}</p>
          <Button asChild size="sm" variant="secondary" className="mt-4 bg-white text-ink hover:bg-paper"><Link href="/quote">{t("cms.contact.quote.cta")}</Link></Button>
        </div>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-surface p-5 md:p-8">
          <h2 className="t-h3 mb-5">{t("cms.contact.form.title")}</h2>
          <ContactForm defaultSubject={sp.subject} />
        </div>
        <aside className="space-y-4 text-sm">
          <h2 className="t-label text-muted">{t("cms.contact.details.title")}</h2>
          <p className="flex items-start gap-2"><Mail className="mt-0.5 size-4 text-muted" aria-hidden /><a href={`mailto:${settings.supportEmail}`} className="underline underline-offset-2">{settings.supportEmail}</a></p>
          <p className="flex items-start gap-2"><Phone className="mt-0.5 size-4 text-muted" aria-hidden />{settings.supportPhone}</p>
          <p className="flex items-start gap-2"><Clock className="mt-0.5 size-4 text-muted" aria-hidden />{settings.supportHours}</p>
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 text-muted" aria-hidden /><span>{settings.companyAddress.line1}<br />{settings.companyAddress.postalCode} {settings.companyAddress.city}</span></p>
        </aside>
      </div>
    </Section>
  );
}
