"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { productSaveAction } from "@/app/actions/admin/catalog";
import { emptyProduct, formStateToPayload, type ProductFormState, type ProductRefs } from "./product-form-types";
import { ProductGeneralPanel } from "./product-form-general";
import { ProductImagesPanel } from "./product-form-images";
import { ProductVariantsPanel } from "./product-form-variants";
import { ProductStockPanel } from "./product-form-stock";
import { ProductAttributesPanel, ProductDocumentsPanel, ProductFaqsPanel, ProductRelatedPanel } from "./product-form-extras";

const TABS = ["general", "images", "variants", "stock", "attributes", "documents", "faqs", "related"] as const;
type Tab = (typeof TABS)[number];

function tabFor(path: string): Tab {
  if (path.startsWith("variants.")) return path.includes(".stock") ? "stock" : "variants";
  if (path.startsWith("variants")) return "variants";
  for (const tab of TABS) if (path.startsWith(tab)) return tab;
  return "general";
}

/** Formulaire produit complet : état local, onglets, envoi en un seul payload validé côté serveur. */
export function ProductForm({ initial, refs }: { initial?: ProductFormState; refs: ProductRefs }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = React.useState<ProductFormState>(() => initial ?? emptyProduct());
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>("general");
  const [dirty, setDirty] = React.useState(false);
  const [pending, start] = React.useTransition();
  const update = React.useCallback((patch: Partial<ProductFormState>) => { setForm((f) => ({ ...f, ...patch })); setDirty(true); }, []);

  React.useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = () => {
    const { payload, invalid } = formStateToPayload(form);
    if (invalid.length) {
      setErrors(Object.fromEntries(invalid.map((k) => [k, ["invalid"]])));
      setError(t("admin.products.form.invalidFields", { fields: invalid.slice(0, 6).join(", ") }));
      setTab(tabFor(invalid[0]));
      return;
    }
    start(async () => {
      const r = await productSaveAction(payload);
      if (r.ok) {
        toast.success(r.message ?? "");
        setErrors({});
        setError(null);
        setDirty(false);
        if (!form.id && r.data) router.push(`/admin/products/${r.data.id}`);
        else router.refresh();
      } else {
        setError(r.error);
        setErrors(r.fieldErrors ?? {});
        const first = Object.keys(r.fieldErrors ?? {})[0];
        if (first) setTab(tabFor(first));
      }
    });
  };

  const labels: Record<Tab, string> = { general: t("admin.products.form.general"), images: t("admin.products.form.images"), variants: t("admin.products.form.variants"), stock: t("admin.products.form.stock"), attributes: t("admin.products.form.attributes"), documents: t("admin.products.form.documents"), faqs: t("admin.products.form.faqs"), related: t("admin.products.form.related") };
  const counts: Partial<Record<Tab, number>> = { images: form.images.length, variants: form.variants.length, attributes: form.attributes.length, documents: form.documents.length, faqs: form.faqs.length, related: form.related.length };
  const panel = { form, update, refs, errors };

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
      <FormError message={error} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <div className="sticky top-14 z-20 -mx-4 bg-paper px-4 lg:top-0 lg:mx-0 lg:px-0">
          <div className="flex items-end justify-between gap-3">
            <TabsList className="min-w-0 flex-1">{TABS.map((k) => <TabsTrigger key={k} value={k}>{labels[k]}{counts[k] ? <span className="ms-1.5 rounded-full bg-paper-2 px-1.5 text-[10px] text-muted tnum">{counts[k]}</span> : null}</TabsTrigger>)}</TabsList>
            <div className="flex shrink-0 items-center gap-2 pb-2">{dirty && <span className="hidden text-xs text-warning sm:inline">{t("admin.products.form.unsaved")}</span>}<Button type="submit" size="sm" loading={pending}>{t("admin.products.form.save")}</Button></div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 md:p-6">
          <TabsContent value="general" className="pt-0"><ProductGeneralPanel {...panel} /></TabsContent>
          <TabsContent value="images" className="pt-0"><ProductImagesPanel {...panel} /></TabsContent>
          <TabsContent value="variants" className="pt-0"><ProductVariantsPanel {...panel} /></TabsContent>
          <TabsContent value="stock" className="pt-0"><ProductStockPanel {...panel} /></TabsContent>
          <TabsContent value="attributes" className="pt-0"><ProductAttributesPanel {...panel} /></TabsContent>
          <TabsContent value="documents" className="pt-0"><ProductDocumentsPanel {...panel} /></TabsContent>
          <TabsContent value="faqs" className="pt-0"><ProductFaqsPanel {...panel} /></TabsContent>
          <TabsContent value="related" className="pt-0"><ProductRelatedPanel {...panel} /></TabsContent>
        </div>
      </Tabs>
      <div className="flex justify-end"><Button type="submit" loading={pending}>{t("admin.products.form.save")}</Button></div>
    </form>
  );
}
