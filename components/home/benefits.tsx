import { BadgePercent, Layers, RotateCcw, FileText, Headset } from "lucide-react";
import { getT } from "@/i18n/server";

/** Avantages KAYEN : section compacte, sans cartes lourdes. */
export async function BenefitsSection() {
  const t = await getT();
  const items = [
    { icon: BadgePercent, title: t("home.benefits.items.pricing.title"), desc: t("home.benefits.items.pricing.desc") },
    { icon: Layers, title: t("home.benefits.items.catalog.title"), desc: t("home.benefits.items.catalog.desc") },
    { icon: RotateCcw, title: t("home.benefits.items.reorder.title"), desc: t("home.benefits.items.reorder.desc") },
    { icon: FileText, title: t("home.benefits.items.quote.title"), desc: t("home.benefits.items.quote.desc") },
    { icon: Headset, title: t("home.benefits.items.support.title"), desc: t("home.benefits.items.support.desc") },
  ];
  return (
    <section className="border-y border-border bg-ink text-white">
      <div className="container-site">
        <ul className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x lg:divide-y-0 rtl:lg:divide-x-reverse">
          {items.map((item) => (
            <li key={item.title} className="flex items-start gap-3 py-5 lg:px-5 lg:first:ps-0 lg:last:pe-0">
              <item.icon className="mt-0.5 size-5 shrink-0 text-accent-soft" aria-hidden />
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-xs text-white/70">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
