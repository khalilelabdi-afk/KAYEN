# Données de démonstration

- `types.ts` — contrat des données.
- `data/attributes.ts`, `data/categories.ts`, `data/brands.ts`, `data/sectors.ts` — structure du catalogue.
- `data/products/*.ts` — produits par univers (restauration, hôtel, hygiène, fitness, bureau…).
- `data/promotions.ts`, `data/guides.ts`, `data/faq.ts`, `data/pages.ts`, `data/synonyms.ts` — contenu.
- `index.ts` — script d'insertion (`pnpm db:seed`).

Les visuels produits sont des SVG générés (`pnpm placeholders`) dans `public/images/products/`,
faciles à remplacer par de vraies photos : il suffit de changer `ProductImage.url`.
