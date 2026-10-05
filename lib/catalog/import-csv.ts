/**
 * Import catalogue CSV : parseur + validateur purs (sans accès base).
 * En-tête attendu : sku;name;category_slug;brand_slug;price_ht;moq;order_multiple;unit_label;packaging_label;stock;
 *                   short_description;description;tier1_qty;tier1_price;tier2_qty;tier2_price;…;attr_<code>…
 * Séparateur ";" ou "," (détecté sur l'en-tête), guillemets RFC 4180, BOM toléré.
 */
export const REQUIRED_COLUMNS = ["sku", "name", "category_slug", "price_ht", "moq"] as const;
export const OPTIONAL_COLUMNS = ["brand_slug", "order_multiple", "unit_label", "packaging_label", "stock", "short_description", "description"] as const;
export const MAX_TIERS = 10;

export type ImportErrorCode = "missing_sku" | "missing_name" | "missing_header" | "unknown_category" | "unknown_brand" | "invalid_price" | "invalid_moq" | "invalid_order_multiple" | "invalid_stock" | "invalid_tier" | "unknown_attribute" | "duplicate_sku" | "column_count" | "empty_file";

export interface ImportLineError { line: number; sku: string | null; errors: { code: ImportErrorCode; value?: string }[] }

export interface ImportRow {
  line: number;
  sku: string;
  name: string;
  categorySlug: string;
  categoryId: string;
  brandSlug: string | null;
  brandId: string | null;
  priceHt: number;
  moq: number;
  orderMultiple: number;
  unitLabel: string;
  packagingLabel: string | null;
  /** null = colonne vide : le stock existant n'est pas modifié. */
  stock: number | null;
  shortDescription: string | null;
  description: string | null;
  tiers: { minQuantity: number; unitPrice: number }[];
  attributes: { code: string; attributeId: string; value: string }[];
}

export interface ImportContext {
  /** slug → id */
  categories: Map<string, string>;
  /** slug → id */
  brands: Map<string, string>;
  /** code → id */
  attributes: Map<string, string>;
}

export interface ParsedCsv { delimiter: ";" | ","; header: string[]; records: { line: number; cells: string[] }[] }
export interface ImportResult { totalRows: number; rows: ImportRow[]; errors: ImportLineError[] }

export function detectDelimiter(headerLine: string): ";" | "," {
  const semi = (headerLine.match(/;/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  return comma > semi ? "," : ";";
}

/** Parse un CSV complet (guillemets, retours à la ligne dans les champs, CRLF). Les lignes vides sont ignorées. */
export function parseCsv(text: string): ParsedCsv {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let startLine = 1;
  const pushRow = () => {
    cells.push(cell);
    if (cells.some((c) => c.trim() !== "")) rows.push({ line: startLine, cells });
    cells = [];
    cell = "";
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else {
        if (ch === "\n") line++;
        cell += ch;
      }
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === delimiter) { cells.push(cell); cell = ""; continue; }
    if (ch === "\r") continue;
    if (ch === "\n") { pushRow(); line++; startLine = line; continue; }
    cell += ch;
  }
  if (cell !== "" || cells.length) pushRow();
  const header = (rows[0]?.cells ?? []).map((h) => h.trim().toLowerCase().replace(/^﻿/, ""));
  return { delimiter, header, records: rows.slice(1) };
}

/** "12,50", "12.5", "12,50 €" → centimes. */
export function parseCsvMoney(value: string): number | null {
  const normalized = value.replace(/[€\s ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,4})?$/.test(normalized)) return null;
  return Math.round(Number.parseFloat(normalized) * 100);
}

function parseIntStrict(value: string): number | null {
  const v = value.trim();
  if (!/^-?\d+$/.test(v)) return null;
  return Number.parseInt(v, 10);
}

/** Valide les lignes parsées contre les référentiels. Retourne lignes valides et erreurs par ligne. */
export function validateImport(parsed: ParsedCsv, ctx: ImportContext): ImportResult {
  const { header, records } = parsed;
  const errors: ImportLineError[] = [];
  const headerErrors: ImportLineError["errors"] = [];
  const col = (name: string) => header.indexOf(name);
  for (const required of REQUIRED_COLUMNS) if (col(required) === -1) headerErrors.push({ code: "missing_header", value: required });
  const attrColumns: { index: number; code: string; attributeId: string | null }[] = [];
  header.forEach((h, index) => {
    if (!h.startsWith("attr_")) return;
    const code = h.slice(5);
    const attributeId = ctx.attributes.get(code) ?? null;
    if (!attributeId) headerErrors.push({ code: "unknown_attribute", value: code });
    attrColumns.push({ index, code, attributeId });
  });
  if (!records.length) headerErrors.push({ code: "empty_file" });
  if (headerErrors.length) errors.push({ line: 1, sku: null, errors: headerErrors });
  if (headerErrors.some((e) => e.code === "missing_header" || e.code === "empty_file")) return { totalRows: records.length, rows: [], errors };

  const seen = new Map<string, number>();
  const rows: ImportRow[] = [];
  const get = (cells: string[], name: string) => { const i = col(name); return i === -1 ? "" : (cells[i] ?? "").trim(); };

  for (const rec of records) {
    const errs: ImportLineError["errors"] = [];
    const cells = rec.cells;
    if (cells.length > header.length) errs.push({ code: "column_count", value: `${cells.length}/${header.length}` });
    const sku = get(cells, "sku").toUpperCase();
    const name = get(cells, "name");
    if (!sku) errs.push({ code: "missing_sku" });
    else if (seen.has(sku)) errs.push({ code: "duplicate_sku", value: `${sku} (L${seen.get(sku)})` });
    else seen.set(sku, rec.line);
    if (!name) errs.push({ code: "missing_name" });
    const categorySlug = get(cells, "category_slug").toLowerCase();
    const categoryId = ctx.categories.get(categorySlug) ?? null;
    if (!categoryId) errs.push({ code: "unknown_category", value: categorySlug || "—" });
    const brandSlug = get(cells, "brand_slug").toLowerCase() || null;
    const brandId = brandSlug ? (ctx.brands.get(brandSlug) ?? null) : null;
    if (brandSlug && !brandId) errs.push({ code: "unknown_brand", value: brandSlug });
    const priceRaw = get(cells, "price_ht");
    const priceHt = parseCsvMoney(priceRaw);
    if (priceHt === null || priceHt <= 0) errs.push({ code: "invalid_price", value: priceRaw || "—" });
    const moqRaw = get(cells, "moq");
    const moq = moqRaw ? parseIntStrict(moqRaw) : 1;
    if (moq === null || moq < 1) errs.push({ code: "invalid_moq", value: moqRaw });
    const omRaw = get(cells, "order_multiple");
    const orderMultiple = omRaw ? parseIntStrict(omRaw) : 1;
    if (orderMultiple === null || orderMultiple < 1) errs.push({ code: "invalid_order_multiple", value: omRaw });
    const stockRaw = get(cells, "stock");
    const stock = stockRaw ? parseIntStrict(stockRaw) : null;
    if (stockRaw && (stock === null || stock < 0)) errs.push({ code: "invalid_stock", value: stockRaw });
    const tiers: ImportRow["tiers"] = [];
    for (let n = 1; n <= MAX_TIERS; n++) {
      const qRaw = get(cells, `tier${n}_qty`);
      const pRaw = get(cells, `tier${n}_price`);
      if (!qRaw && !pRaw) continue;
      const q = parseIntStrict(qRaw);
      const p = parseCsvMoney(pRaw);
      if (q === null || q < 1 || p === null || p <= 0 || tiers.some((x) => x.minQuantity === q)) { errs.push({ code: "invalid_tier", value: `tier${n} (${qRaw || "—"} / ${pRaw || "—"})` }); continue; }
      tiers.push({ minQuantity: q, unitPrice: p });
    }
    const attributes: ImportRow["attributes"] = [];
    for (const ac of attrColumns) {
      const value = (cells[ac.index] ?? "").trim();
      if (!value) continue;
      if (!ac.attributeId) { errs.push({ code: "unknown_attribute", value: ac.code }); continue; }
      attributes.push({ code: ac.code, attributeId: ac.attributeId, value });
    }
    if (errs.length) { errors.push({ line: rec.line, sku: sku || null, errors: errs }); continue; }
    rows.push({
      line: rec.line, sku, name, categorySlug, categoryId: categoryId!, brandSlug, brandId, priceHt: priceHt!, moq: moq!, orderMultiple: orderMultiple!,
      unitLabel: get(cells, "unit_label") || "unité", packagingLabel: get(cells, "packaging_label") || null, stock,
      shortDescription: get(cells, "short_description") || null, description: get(cells, "description") || null,
      tiers: tiers.sort((a, b) => a.minQuantity - b.minQuantity), attributes,
    });
  }
  return { totalRows: records.length, rows, errors };
}

/** Modèle CSV (en-tête + exemple). */
export function buildCsvTemplate(attributeCodes: string[]): string {
  const header = [...REQUIRED_COLUMNS.slice(0, 3), "brand_slug", "price_ht", "moq", "order_multiple", "unit_label", "packaging_label", "stock", "short_description", "description", "tier1_qty", "tier1_price", "tier2_qty", "tier2_price", ...attributeCodes.map((c) => `attr_${c}`)];
  const example = ["EXEMPLE-001", "Produit exemple", "categorie-slug", "marque-slug", "12,50", "6", "6", "carton", "Carton de 6", "120", "Description courte", "Description longue (Markdown)", "24", "11,90", "48", "11,20", ...attributeCodes.map(() => "")];
  const esc = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return `﻿${header.join(";")}\n${example.map(esc).join(";")}\n`;
}
