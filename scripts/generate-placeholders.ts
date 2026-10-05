/**
 * Génère les visuels SVG provisoires (produits, catégories, activités, guides, marques)
 * dans public/images/. Lancer : pnpm placeholders
 * Les fichiers sont déterministes : relancer le script ne crée pas de diff inutile.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderPlaceholderSvg } from "../lib/placeholders/render";
import { categories } from "../db/seed/data/categories";
import { sectors } from "../db/seed/data/sectors";
import { brands } from "../db/seed/data/brands";
import { guides } from "../db/seed/data/guides";
import { allProducts } from "../db/seed/data/products";
import type { SeedCategory } from "../db/seed/types";

const root = join(process.cwd(), "public", "images");
const dirs = { products: join(root, "products"), categories: join(root, "categories"), sectors: join(root, "sectors"), guides: join(root, "guides"), brands: join(root, "brands") };
for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true });

function write(path: string, svg: string) {
  writeFileSync(path, svg, "utf8");
}

const toneCycle = ["sand", "stone", "sage", "clay", "mist", "olive", "linen", "slate"];
const categoryPictos: Record<string, string> = {
  restauration: "plate", hotellerie: "bedding", hygiene: "spray", emballage: "box", bureau: "desk", fitness: "dumbbell", mobilier: "chair",
  equipement: "machine", "beaute-spa": "towel", sante: "mask", evenementiel: "tent", securite: "cone",
};

let count = 0;
// Produits : 1 à 3 images par produit (+ variantes avec image propre si définies)
for (const p of allProducts) {
  const n = Math.min(3, Math.max(1, p.imageCount ?? 1));
  for (let i = 0; i < n; i++) {
    write(join(dirs.products, `${p.sku.toLowerCase()}-${i + 1}.svg`), renderPlaceholderSvg({ tone: p.tone, pictogram: p.pictogram, label: p.sku, variant: i as 0 | 1 | 2 }));
    count++;
  }
}

// Catégories (4:3) — pictogramme hérité de la racine
function walk(nodes: SeedCategory[], rootSlug: string | null, depth = 0) {
  nodes.forEach((c, i) => {
    const rs = rootSlug ?? c.slug;
    const tone = toneCycle[(i + depth * 3) % toneCycle.length];
    write(join(dirs.categories, `${c.slug}.svg`), renderPlaceholderSvg({ tone, pictogram: categoryPictos[rs] ?? "generic", label: c.name, width: 1200, height: 900, scale: 0.4, showLabel: false }));
    count++;
    if (c.children) walk(c.children, rs, depth + 1);
  });
}
walk(categories, null);

// Activités (16:10)
const sectorPictos: Record<string, string> = { "cafe-restaurant": "cup", hotel: "bedding", "salle-de-sport": "kettlebell", bureau: "monitor", commerce: "cart", "beaute-spa": "towel", sante: "mask", evenementiel: "tent" };
sectors.forEach((s, i) => {
  write(join(dirs.sectors, `${s.slug}.svg`), renderPlaceholderSvg({ tone: toneCycle[(i + 2) % toneCycle.length], pictogram: sectorPictos[s.slug] ?? "generic", label: s.name, width: 1600, height: 1000, scale: 0.38, showLabel: false }));
  count++;
});

// Guides (16:9)
guides.forEach((g) => {
  write(join(dirs.guides, `${g.slug}.svg`), renderPlaceholderSvg({ tone: g.tone, pictogram: g.pictogram, label: g.title, width: 1600, height: 900, scale: 0.36, showLabel: false }));
  count++;
});

// Marques : wordmark typographique sobre
brands.forEach((b, i) => {
  const tone = toneCycle[i % toneCycle.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300" role="img" aria-label="${b.name}">
<rect width="600" height="300" fill="#FFFFFF"/>
<text x="300" y="172" text-anchor="middle" font-family="Manrope, Inter, system-ui, sans-serif" font-size="${b.name.length > 12 ? 60 : 76}" font-weight="800" letter-spacing="-0.03em" fill="#111111">${b.name.replace(/&/g, "&amp;")}</text>
<rect x="270" y="206" width="60" height="5" fill="${{ sand: "#C9B99A", stone: "#BDB8AD", sage: "#A9BBA6", clay: "#C8A897", mist: "#AEB9BC", olive: "#B6B894", linen: "#D2C8B4", slate: "#A6ABB8" }[tone]}"/>
</svg>`;
  write(join(dirs.brands, `${b.slug}.svg`), svg);
  count++;
});

// Visuels génériques du site (hero, bannières, OG)
const site = join(root, "site");
mkdirSync(site, { recursive: true });
const heroItems: { pictogram: string; tone: string; label: string }[] = [
  { pictogram: "cup", tone: "sand", label: "Restauration" },
  { pictogram: "spray", tone: "sage", label: "Hygiène" },
  { pictogram: "box", tone: "clay", label: "Emballage" },
  { pictogram: "dumbbell", tone: "mist", label: "Fitness" },
  { pictogram: "bedding", tone: "linen", label: "Hôtellerie" },
  { pictogram: "desk", tone: "stone", label: "Bureau" },
];
heroItems.forEach((h, i) => {
  write(join(site, `hero-${i + 1}.svg`), renderPlaceholderSvg({ ...h, width: 800, height: 800, scale: 0.46, showLabel: false }));
  count++;
});
{
  write(join(site, "quote-banner.svg"), renderPlaceholderSvg({ pictogram: "kit", tone: "olive", label: "Devis", width: 1600, height: 900, scale: 0.34, showLabel: false }));
  count++;
}
console.log(`✔ ${count} visuels générés dans public/images/`);
