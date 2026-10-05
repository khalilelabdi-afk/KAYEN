import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { getFaqs } from "@/services/cms";
import { Section } from "@/components/layout/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { JsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("cms.faq.title"), description: t("cms.faq.subtitle"), alternates: { canonical: "/faq" } };
}

export default async function FaqPage() {
  const [t, faqs] = await Promise.all([getT(), getFaqs()]);
  const order = ["commande", "compte", "prix", "livraison", "devis", "paiement", "facturation", "retours", "disponibilite"];
  const groups = order.map((cat) => ({ cat, items: faqs.filter((f) => f.category === cat) })).filter((g) => g.items.length);
  return (
    <Section className="py-6 md:py-10">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }} />
      <Breadcrumb items={[{ label: t("common.breadcrumb.home"), href: "/" }, { label: t("cms.faq.title") }]} label={t("common.breadcrumb.label")} className="mb-4" />
      <h1 className="t-h1">{t("cms.faq.title")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t("cms.faq.subtitle")}</p>
      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block" aria-label={t("cms.faq.title")}>
          <ul className="sticky top-32 space-y-1 text-sm">
            {groups.map((g) => (<li key={g.cat}><a href={`#faq-${g.cat}`} className="block rounded-md px-3 py-1.5 text-muted hover:bg-paper-2 hover:text-foreground">{t.enum("cms.faq.categories", g.cat)}</a></li>))}
          </ul>
        </nav>
        <div className="max-w-3xl space-y-10">
          {groups.map((g) => (
            <section key={g.cat} id={`faq-${g.cat}`} className="scroll-mt-32">
              <h2 className="t-h3 mb-2">{t.enum("cms.faq.categories", g.cat)}</h2>
              <Accordion type="multiple">
                {g.items.map((f) => (
                  <AccordionItem key={f.id} value={f.id}>
                    <AccordionTrigger>{f.question}</AccordionTrigger>
                    <AccordionContent>{f.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="font-semibold">{t("cms.faq.stillQuestion")}</p>
            <Button asChild variant="outline" size="sm" className="mt-3"><Link href="/contact">{t("cms.faq.contact")}</Link></Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
