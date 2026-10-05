import { FileText, Download } from "lucide-react";
import { getT } from "@/i18n/server";
import { renderMarkdown } from "@/lib/markdown";
import type { ProductDetail } from "@/services/catalog/product";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

/** Informations produit : description, caractéristiques, conditionnement, conseils, livraison, documents, FAQ. */
export async function ProductInfoTabs({ product, leadTime }: { product: ProductDetail; leadTime: { minDays: number; maxDays: number } }) {
  const t = await getT();
  const v = product.variants[0];
  const specs: { label: string; value: string }[] = [
    { label: t("catalog.pdp.specs.sku"), value: product.sku },
    ...(product.brand ? [{ label: t("catalog.pdp.specs.brand"), value: product.brand.name }] : []),
    { label: t("catalog.pdp.specs.category"), value: product.category.name },
    ...product.attributes.map((a) => ({ label: a.name, value: a.unit ? `${a.value} ${a.unit}` : a.value })),
    ...(v?.dimensionsMm ? [{ label: t("catalog.pdp.specs.dimensions"), value: `${v.dimensionsMm[0]} × ${v.dimensionsMm[1]} × ${v.dimensionsMm[2]} mm` }] : []),
    ...(v?.weightGrams ? [{ label: t("catalog.pdp.specs.weight"), value: v.weightGrams >= 1000 ? `${(v.weightGrams / 1000).toFixed(2)} kg` : `${v.weightGrams} g` }] : []),
  ];
  const packaging = product.variants.map((pv) => ({ sku: pv.sku, name: pv.name, packaging: pv.packagingLabel ?? pv.unitLabel, unitsPerPack: pv.unitsPerPack, moq: pv.moq, multiple: pv.orderMultiple }));

  const tabs = [
    { key: "description", label: t("catalog.pdp.tabs.description"), show: !!product.description },
    { key: "specs", label: t("catalog.pdp.tabs.specs"), show: specs.length > 0 },
    { key: "packaging", label: t("catalog.pdp.tabs.packaging"), show: true },
    { key: "usage", label: t("catalog.pdp.tabs.usage"), show: !!product.usageTips },
    { key: "delivery", label: t("catalog.pdp.tabs.delivery"), show: true },
    { key: "documents", label: t("catalog.pdp.tabs.documents"), show: product.documents.length > 0 },
    { key: "faq", label: t("catalog.pdp.tabs.faq"), show: product.faqs.length > 0 },
  ].filter((x) => x.show);

  return (
    <Tabs defaultValue={tabs[0]?.key}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
      {product.description && (
        <TabsContent value="description">
          <div className="prose-kayen max-w-3xl text-[15px]" dangerouslySetInnerHTML={{ __html: renderMarkdown(product.description) }} />
        </TabsContent>
      )}
      <TabsContent value="specs">
        <dl className="grid max-w-3xl grid-cols-1 overflow-hidden rounded-lg border border-border bg-surface text-sm sm:grid-cols-2">
          {specs.map((s, i) => (
            <div key={`${s.label}-${i}`} className="flex gap-3 border-b border-border px-4 py-2.5 sm:odd:border-e">
              <dt className="w-40 shrink-0 text-muted">{s.label}</dt>
              <dd className="font-medium">{s.value}</dd>
            </div>
          ))}
        </dl>
      </TabsContent>
      <TabsContent value="packaging">
        <div className="max-w-3xl overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-paper-2/70 text-xs text-muted">
              <tr>
                <th className="px-4 py-2 text-start font-semibold">{t("common.labels.sku")}</th>
                <th className="px-4 py-2 text-start font-semibold">{t("catalog.pdp.packaging")}</th>
                <th className="px-4 py-2 text-end font-semibold">{t("catalog.pdp.specs.unitsPerPack")}</th>
                <th className="px-4 py-2 text-end font-semibold">{t("catalog.pdp.specs.moq")}</th>
                <th className="px-4 py-2 text-end font-semibold">{t("catalog.pdp.specs.orderMultiple")}</th>
              </tr>
            </thead>
            <tbody>
              {packaging.map((p) => (
                <tr key={p.sku} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{p.sku}{p.name && <span className="block text-xs font-normal text-muted">{p.name}</span>}</td>
                  <td className="px-4 py-2">{p.packaging}</td>
                  <td className="px-4 py-2 text-end tnum">{p.unitsPerPack ?? "—"}</td>
                  <td className="px-4 py-2 text-end tnum">{p.moq}</td>
                  <td className="px-4 py-2 text-end tnum">{p.multiple}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
      {product.usageTips && (
        <TabsContent value="usage">
          <div className="prose-kayen max-w-3xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(product.usageTips) }} />
        </TabsContent>
      )}
      <TabsContent value="delivery">
        <div className="prose-kayen max-w-3xl text-sm">
          <p>{t("catalog.pdp.delivery", { min: leadTime.minDays, max: leadTime.maxDays })}</p>
          {product.shippingInfo && <div dangerouslySetInnerHTML={{ __html: renderMarkdown(product.shippingInfo) }} />}
          <p className="text-muted">{t("common.trust.proDeliveryDesc")}</p>
        </div>
      </TabsContent>
      {product.documents.length > 0 && (
        <TabsContent value="documents">
          <ul className="grid max-w-3xl gap-2 sm:grid-cols-2">
            {product.documents.map((d) => (
              <li key={d.id}>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm hover:border-ink">
                  <FileText className="size-5 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{d.name}</span>
                    <span className="block text-xs text-muted">{t.enum("catalog.pdp.documents", d.type)}</span>
                  </span>
                  <Download className="size-4 text-muted" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </TabsContent>
      )}
      {product.faqs.length > 0 && (
        <TabsContent value="faq">
          <Accordion type="multiple" className="max-w-3xl">
            {product.faqs.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger>{f.question}</AccordionTrigger>
                <AccordionContent>{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      )}
    </Tabs>
  );
}
