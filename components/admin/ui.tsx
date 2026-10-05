import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Carte statistique du tableau de bord. */
export function StatCard({ label, value, hint, href, tone }: { label: string; value: string; hint?: string; href?: string; tone?: "accent" | "warning" }) {
  const body = (
    <>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tnum", tone === "accent" && "text-accent", tone === "warning" && "text-warning")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  const cls = "block rounded-lg border border-border bg-surface p-4 transition-colors";
  return href ? <Link href={href} className={cn(cls, "hover:border-ink")}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Barre de filtres GET standard. */
export function FilterBar({ children, searchName = "q", searchValue, searchPlaceholder, submitLabel, className }: { children?: React.ReactNode; searchName?: string; searchValue?: string; searchPlaceholder: string; submitLabel: string; className?: string }) {
  return (
    <form method="get" className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      <Input name={searchName} defaultValue={searchValue} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="h-9 w-64 text-sm" />
      {children}
      <Button type="submit" size="sm" variant="secondary">{submitLabel}</Button>
    </form>
  );
}

export function FilterSelect({ name, value, options, allLabel, label }: { name: string; value?: string; options: { value: string; label: string }[]; allLabel: string; label: string }) {
  return (
    <Select name={name} defaultValue={value ?? ""} aria-label={label} className="h-9 w-44 text-sm">
      <option value="">{allLabel}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  );
}

export function AdminCard({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface", className)}>
      {(title || actions) && <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><h2 className="t-h4">{title}</h2>{actions}</div>}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function DescriptionList({ items, className }: { items: { label: string; value: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]", className)}>
      {items.map((it) => (
        <div key={it.label} className="contents">
          <dt className="text-muted">{it.label}</dt>
          <dd className="font-medium">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Pagination simple par query string. */
export function AdminPagination({ page, totalPages, basePath, params, labels }: { page: number; totalPages: number; basePath: string; params: Record<string, string | undefined>; labels: { previous: string; next: string; page: string } }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted">{labels.page}</span>
      <div className="flex gap-2">
        {page > 1 ? <Button asChild size="sm" variant="outline"><Link href={href(page - 1)}>{labels.previous}</Link></Button> : <Button size="sm" variant="outline" disabled>{labels.previous}</Button>}
        {page < totalPages ? <Button asChild size="sm" variant="outline"><Link href={href(page + 1)}>{labels.next}</Link></Button> : <Button size="sm" variant="outline" disabled>{labels.next}</Button>}
      </div>
    </div>
  );
}
