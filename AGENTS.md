<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# KAYEN — notes pour les agents

- Lire `README.md` (architecture, principes) avant toute modification.
- Prix : toujours passer par `lib/pricing` (jamais de calcul de prix dans un composant). Montants en centimes HT, taux en points de base.
- Chaînes UI : `i18n/dictionaries/fr/*.ts` uniquement (`getT()` serveur / `useT()` client). Pas de français en dur dans les composants.
- Autorisations : `requireUser` / `requireBusinessUser` / `requireStaff` / `requireAdmin` (`lib/auth/dal.ts`) dans chaque page et action sensible.
- Caches : `unstable_cache` + tags (`categories`, `products`, `brands`, `sectors`, `promotions`, `cms`, `settings`, `shipping`, `taxes`, `search`) → `revalidateTag(tag, "max")` après écriture.
- Next 16 : `params` / `searchParams` / `cookies()` / `headers()` sont asynchrones ; `proxy.ts` remplace le middleware ; React Compiler lint interdit `setState` synchrone dans un effet (utiliser le motif « dériver l'état des props » pendant le rendu).
- Vérifier avant de livrer : `pnpm typecheck && pnpm lint && pnpm test`.
