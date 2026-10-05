"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Clock, ArrowUpRight, Loader2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { track } from "@/lib/analytics";
import type { ProductCardData } from "@/types/catalog";

interface Suggestions {
  products: ProductCardData[];
  categories: { name: string; href: string; path: string }[];
  brands: { name: string; href: string }[];
  queries: string[];
  didYouMean: string | null;
}

const RECENT_KEY = "kayen_recent_searches";
const empty: Suggestions = { products: [], categories: [], brands: [], queries: [], didYouMean: null };

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 6);
  } catch {
    return [];
  }
}
function pushRecent(q: string) {
  try {
    const next = [q, ...readRecent().filter((r) => r !== q)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible */
  }
}

export function SearchBar({ placeholder, compact = false, autoFocus = false, onNavigate, initialQuery = "" }: { placeholder: string; compact?: boolean; autoFocus?: boolean; onNavigate?: () => void; initialQuery?: string }) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Suggestions>(empty);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [active, setActive] = React.useState(-1);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const listId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (res.ok) setData((await res.json()) as Suggestions);
      } catch {
        /* requête annulée ou réseau */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, q.length < 2 ? 0 : 180);
    return () => clearTimeout(timer);
  }, [query, open]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (href: string, term?: string) => {
    if (term) pushRecent(term);
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    track({ name: "search", params: { search_term: q } });
    go(`/search?q=${encodeURIComponent(q)}`, q);
  };

  const q = query.trim();
  const showRecent = q.length < 2;
  const items: { key: string; href: string; label: string; term?: string }[] = [
    ...(showRecent ? recent.map((r) => ({ key: `r-${r}`, href: `/search?q=${encodeURIComponent(r)}`, label: r, term: r })) : []),
    ...data.queries.map((s) => ({ key: `q-${s}`, href: `/search?q=${encodeURIComponent(s)}`, label: s, term: s })),
    ...data.products.map((p) => ({ key: `p-${p.id}`, href: p.href, label: p.name })),
    ...data.categories.map((c) => ({ key: `c-${c.href}`, href: c.href, label: c.name })),
    ...data.brands.map((b) => ({ key: `b-${b.href}`, href: b.href, label: b.name })),
  ];

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter" && active >= 0 && items[active]) {
      e.preventDefault();
      go(items[active].href, items[active].term);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const hasContent = showRecent ? recent.length > 0 || data.queries.length > 0 : items.length > 0 || data.didYouMean || (!loading && q.length >= 2);

  return (
    <div ref={rootRef} className="relative w-full">
      <form role="search" onSubmit={submit} className={cn("flex items-stretch overflow-hidden rounded-md border border-border-strong bg-surface transition-colors focus-within:border-ink focus-within:ring-2 focus-within:ring-accent/25", compact ? "h-10" : "h-11")}>
        <div className="flex items-center ps-3 text-muted">
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
        </div>
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => {
            setRecent(readRecent());
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={t("nav.header.searchLabel")}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-2.5 text-sm placeholder:text-subtle focus:outline-none"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="flex items-center px-2 text-muted hover:text-foreground" aria-label={t("common.actions.clear")}>
            <X className="size-4" />
          </button>
        )}
        <button type="submit" className={cn("flex items-center bg-ink px-4 text-sm font-medium text-white hover:bg-black", compact && "px-3")} aria-label={t("common.actions.search")}>
          <span className="hidden sm:inline">{t("common.actions.search")}</span>
          <Search className="size-4 sm:hidden" aria-hidden />
        </button>
      </form>

      {open && hasContent && (
        <div id={listId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg animate-slide-up">
          {showRecent && recent.length > 0 && (
            <section className="p-2">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="t-label text-muted">{t("catalog.search.recent")}</p>
                <button type="button" className="text-xs text-muted hover:text-foreground" onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}>{t("catalog.search.clearRecent")}</button>
              </div>
              {recent.map((r, i) => (
                <SuggestRow key={r} active={active === i} onClick={() => go(`/search?q=${encodeURIComponent(r)}`, r)} icon={<Clock className="size-4 text-muted" />}>{r}</SuggestRow>
              ))}
            </section>
          )}
          {data.queries.length > 0 && (
            <section className="border-t border-border p-2 first:border-0">
              <p className="t-label px-2 py-1 text-muted">{showRecent ? t("catalog.search.popular") : t("catalog.search.suggestions")}</p>
              {data.queries.map((s, i) => {
                const idx = (showRecent ? recent.length : 0) + i;
                return (
                  <SuggestRow key={s} active={active === idx} onClick={() => go(`/search?q=${encodeURIComponent(s)}`, s)} icon={<Search className="size-4 text-muted" />}>{s}</SuggestRow>
                );
              })}
            </section>
          )}
          {data.products.length > 0 && (
            <section className="border-t border-border p-2">
              <p className="t-label px-2 py-1 text-muted">{t("catalog.search.products")}</p>
              {data.products.map((p, i) => {
                const idx = (showRecent ? recent.length : 0) + data.queries.length + i;
                return (
                  <Link key={p.id} href={p.href} onClick={() => { setOpen(false); onNavigate?.(); }} className={cn("flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-paper-2", active === idx && "bg-paper-2")} role="option" aria-selected={active === idx}>
                    <span className="size-11 shrink-0 overflow-hidden rounded-sm border border-border bg-paper-2">
                      {p.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image.url} alt="" width={44} height={44} className="size-full object-cover" loading="lazy" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-medium">{p.name}</span>
                      <span className="block text-xs text-muted">{p.brand?.name ? `${p.brand.name} · ` : ""}{t("common.labels.sku")} {p.sku}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tnum">{p.price.hidden ? "—" : formatMoney(p.price.unitPrice)}</span>
                  </Link>
                );
              })}
            </section>
          )}
          {(data.categories.length > 0 || data.brands.length > 0) && (
            <section className="border-t border-border p-2">
              {data.categories.length > 0 && <p className="t-label px-2 py-1 text-muted">{t("catalog.search.categories")}</p>}
              {data.categories.map((c, i) => {
                const idx = (showRecent ? recent.length : 0) + data.queries.length + data.products.length + i;
                return <SuggestRow key={c.href} active={active === idx} onClick={() => go(c.href)} icon={<ArrowUpRight className="size-4 text-muted" />}>{c.name}</SuggestRow>;
              })}
              {data.brands.length > 0 && <p className="t-label px-2 py-1 text-muted">{t("catalog.search.brands")}</p>}
              {data.brands.map((b, i) => {
                const idx = (showRecent ? recent.length : 0) + data.queries.length + data.products.length + data.categories.length + i;
                return <SuggestRow key={b.href} active={active === idx} onClick={() => go(b.href)} icon={<ArrowUpRight className="size-4 text-muted" />}>{b.name}</SuggestRow>;
              })}
            </section>
          )}
          {!showRecent && !loading && items.length === 0 && (
            <div className="p-4 text-sm text-muted">
              {t("catalog.search.noResults", { query: q })}
              {data.didYouMean && (
                <p className="mt-1">
                  {t("catalog.search.didYouMean")}{" "}
                  <button type="button" className="font-medium text-foreground underline" onClick={() => { setQuery(data.didYouMean!); }}>{data.didYouMean}</button>
                </p>
              )}
            </div>
          )}
          {!showRecent && q.length >= 2 && (
            <button type="button" onClick={() => submit()} className="flex w-full items-center justify-between border-t border-border px-4 py-3 text-sm font-medium hover:bg-paper-2">
              {t("catalog.search.seeAllResults", { query: q })}
              <ArrowUpRight className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestRow({ children, icon, active, onClick }: { children: React.ReactNode; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button type="button" role="option" aria-selected={active} onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-start text-sm hover:bg-paper-2", active && "bg-paper-2")}>
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}
