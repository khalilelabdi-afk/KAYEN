# KAYEN — plateforme e-commerce B2B multi-catégories

> Tout ce dont votre business a besoin, en gros.

KAYEN est une plateforme de vente en gros destinée aux professionnels (restauration, hôtellerie, fitness, bureau, commerce, beauté, santé, événementiel…). Catalogue multi-catégories, prix dégressifs par quantité, comptes professionnels, devis, listes d'achat, commande rapide et back-office complet.

## Stack

| Couche | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Turbopack) |
| Langage | TypeScript strict |
| UI | Tailwind CSS 4, Radix UI (primitives accessibles), lucide-react |
| Base de données | PostgreSQL 16 + Prisma 7 (driver adapter `pg`), recherche plein texte (`tsvector`) + trigrammes (`pg_trgm`) |
| Validation | Zod 4 |
| Auth | Sessions en base + cookie HttpOnly, bcrypt, rôles (client / équipe / admin), rôles entreprise (Owner, Admin, Buyer, Viewer) |
| Emails | Templates HTML responsive (`emails/`), provider `log` (console) ou `resend` |
| Paiement | Architecture modulaire (`lib/payments`) : carte (mock en dev, Stripe à brancher), virement, paiement sur facture |
| Tests | Vitest (logique métier), Playwright (parcours E2E) |

## Démarrage

```bash
pnpm install
cp .env.example .env            # renseigner DATABASE_URL, AUTH_SECRET, etc.
pnpm db:migrate                 # applique les migrations (crée pg_trgm / unaccent)
pnpm placeholders               # génère les visuels SVG provisoires dans public/images
pnpm db:seed                    # catalogue de démonstration + comptes
pnpm dev                        # http://localhost:3000
```

Comptes créés par le seed :

- Administrateur : `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (`admin@kayen.local` / `Admin1234!` par défaut) → `/admin`
- Client professionnel approuvé : `demo@kayen.local` / `Demo1234!` (paiement sur facture activé)

Carte bancaire de test (provider `mock`) : n'importe quel numéro de 12 à 19 chiffres ; un numéro se terminant par `0000` échoue.

## Scripts

| Commande | Rôle |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Développement, build de production, serveur |
| `pnpm typecheck` / `pnpm lint` | TypeScript strict, ESLint (règles Next + React Compiler) |
| `pnpm test` | Tests unitaires Vitest (moteur de prix, paniers, utilitaires) |
| `pnpm test:e2e` | Parcours Playwright (base seedée requise, voir ci-dessous) |
| `pnpm db:migrate` / `db:deploy` / `db:seed` / `db:reset` / `db:studio` | Prisma |
| `pnpm placeholders` | Régénère les visuels provisoires |
| `pnpm tsx scripts/check-seed.ts` | Vérifie la cohérence du jeu de données de démonstration avant seed |
| `node scripts/dev/screenshots.mjs` (et `viewport-shots`, `auth-shots`, `admin-shots`) | Captures d'écran d'audit visuel (serveur sur `localhost:3000`) |

### Tests E2E

Les parcours Playwright (`tests/e2e/`) couvrent le catalogue, la recherche, le panier, l'inscription, la connexion, le checkout carte, la demande de devis, la navigation mobile et le back-office. Ils supposent une base seedée.

```bash
# Contre un build de production (recommandé, temps de réponse stables)
pnpm build && pnpm start &
E2E_BASE_URL=http://localhost:3000 pnpm test:e2e

# Sans E2E_BASE_URL, Playwright démarre lui-même `next dev` (plus lent au premier rendu de chaque page)
pnpm test:e2e
```

`PW_CHROMIUM_PATH=/chemin/vers/chromium` permet d'utiliser un Chromium déjà installé au lieu des navigateurs Playwright.

## Variables d'environnement

Voir `.env.example` (commenté). Obligatoires : `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL` (production). Optionnelles : provider email (`EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`), paiement (`PAYMENT_CARD_PROVIDER`, `STRIPE_*`), stockage (`STORAGE_PROVIDER`, `S3_*`), recherche externe (`SEARCH_PROVIDER`), analytics (`NEXT_PUBLIC_ANALYTICS_*`), hôtes d'images distantes (`IMAGE_REMOTE_HOSTS`). Aucun secret n'est commité.

## Architecture

```
app/                 Routes (App Router)
  (shop)/            Vitrine : accueil, /c (catégorie), /p (produit), /search, /cart, /account, /quote, /guides…
  (auth)/            Connexion, inscription, mot de passe
  checkout/          Tunnel de commande (informations → livraison → paiement → confirmation)
  admin/             Back-office (tableau de bord, commandes, devis, clients, catalogue, promotions, CMS, paramètres, audit)
  actions/           Server Actions (validation Zod, autorisations serveur)
  api/               Route handlers (suggestions de recherche, listes, locale, déconnexion…)
components/          ui/ (design system), commerce/, catalog/, product/, cart/, checkout/, account/, admin/, layout/, home/
lib/                 pricing/ (moteur de prix, source de vérité unique), auth/ (sessions, DAL, rate limit), validation/, payments/, money, markdown, seo, placeholders, analytics
services/            Accès aux données et logique métier (catalogue, recherche, panier, commandes, devis, settings, CMS)
i18n/                Dictionnaires (fr complet ; en / ar partiels avec repli), config locale + RTL
emails/              Templates transactionnels
db/seed/             Données de démonstration (contrat typé + script)
prisma/              Schéma et migrations
tests/               unit/ (Vitest) et e2e/ (Playwright)
```

### Principes

- **Prix recalculés côté serveur** à chaque étape (carte, fiche, panier, checkout, commande) par `lib/pricing` : prix contractuel entreprise > prix de groupe > palier public ; sur le prix public, le client obtient le meilleur entre la remise de groupe et la meilleure promotion (jamais cumulées) ; promotions de commande et coupon appliqués sur le sous-total. Le navigateur n'envoie jamais de prix.
- **Autorisations serveur** : chaque action et chaque page vérifient la session (`lib/auth/dal`). `proxy.ts` ne fait qu'une redirection optimiste.
- **Stock** : jamais négatif sauf `allowBackorder` ; réservation en transaction à la commande, libération à l'annulation, journal des mouvements.
- **Configuration commerciale** centralisée (`lib/config/site.ts`, surchargeable depuis `/admin/settings` via la table `Setting`).
- **i18n** : aucune chaîne en dur dans les composants ; `getT()` côté serveur, `useT()` côté client. L'arabe active `dir="rtl"` (styles logiques `ps-/pe-/start/end`).
- **Images** : visuels SVG provisoires générés (`public/images`), remplaçables en changeant `ProductImage.url` (ou via le back-office / `IMAGE_REMOTE_HOSTS` pour un CDN).
- **Recherche** : provider PostgreSQL (plein texte français sans accents + tolérance aux fautes + synonymes), interface `SearchProvider` prête pour Meilisearch / Algolia.

## Éléments nécessitant de vraies informations commerciales

Les valeurs ci-dessous sont des valeurs provisoires clairement identifiables, modifiables sans code dans `/admin/settings` (ou dans `lib/config/site.ts` pour les défauts) :

- coordonnées (email / téléphone / horaires / adresse de l'entreprise), coordonnées bancaires pour le virement ;
- franco de port, montant minimum de commande, délais indicatifs, validité des devis, modes de livraison et tarifs ;
- taux de TVA et libellé de l'identifiant fiscal selon le marché (`TaxClass`, `taxIdLabel`) ;
- pages légales (mentions légales, CGV, confidentialité, cookies, livraison, paiement, retours) : squelettes avec marqueurs « [À compléter : …] » dans `/admin/pages` ;
- logo définitif (remplacer le wordmark dans `components/layout/logo.tsx` et `app/icon.tsx`), photos produits et marques ;
- catalogue de démonstration (produits, marques fictives, prix, paliers, stocks, promotions, guides) : à remplacer par le vrai assortiment via `/admin/products`, l'import CSV (`/admin/imports`) ou un nouveau jeu de données `db/seed` ;
- clés des providers (email, paiement, stockage, analytics) et, pour la production, un provider de paiement réel (`PAYMENT_CARD_PROVIDER=stripe` avec les clés correspondantes).

Remarques d'exploitation : les dates de promotion saisies dans le back-office sont interprétées dans le fuseau horaire du serveur (`TZ`) ; les comptes professionnels s'inscrivent en statut « en attente » et doivent être approuvés dans `/admin/customers` avant de commander.

Aucune statistique, certification, avis client ou partenaire n'est inventé.
