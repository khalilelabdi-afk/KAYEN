-- Recherche plein texte (français, sans accents) + tolérance aux fautes (trigrammes).
-- Les extensions sont créées ici pour que la base soit autonome.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Wrapper immuable autour de unaccent (nécessaire pour un index d'expression).
CREATE OR REPLACE FUNCTION kayen_unaccent(text) RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- Vecteur de recherche produit : nom (A) > SKU + mots-clés (B) > description courte (C) > description (D)
CREATE OR REPLACE FUNCTION kayen_product_search_vector(
  name text, sku text, keywords text[], short_description text, description text
) RETURNS tsvector AS $$
  SELECT
    setweight(to_tsvector('french', kayen_unaccent(coalesce(name, ''))), 'A') ||
    setweight(to_tsvector('simple', coalesce(sku, '')), 'A') ||
    setweight(to_tsvector('french', kayen_unaccent(coalesce(array_to_string(keywords, ' '), ''))), 'B') ||
    setweight(to_tsvector('french', kayen_unaccent(coalesce(short_description, ''))), 'C') ||
    setweight(to_tsvector('french', kayen_unaccent(coalesce(description, ''))), 'D')
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

CREATE INDEX "Product_search_idx" ON "Product"
  USING GIN (kayen_product_search_vector("name", "sku", "keywords", "shortDescription", "description"));

CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN (kayen_unaccent(lower("name")) gin_trgm_ops);
CREATE INDEX "ProductVariant_sku_trgm_idx" ON "ProductVariant" USING GIN (lower("sku") gin_trgm_ops);
CREATE INDEX "Brand_name_trgm_idx" ON "Brand" USING GIN (kayen_unaccent(lower("name")) gin_trgm_ops);
CREATE INDEX "Category_name_trgm_idx" ON "Category" USING GIN (kayen_unaccent(lower("name")) gin_trgm_ops);
