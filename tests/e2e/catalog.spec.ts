import { test, expect } from "@playwright/test";

test.describe("Catalogue", () => {
  test("recherche produit avec suggestions et page de résultats", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("searchbox", { name: /rechercher/i }).first();
    await input.fill("gobelet");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("listbox").getByRole("option").first()).toBeVisible();
    await input.press("Enter");
    await page.waitForURL(/\/search\?q=gobelet/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("gobelet");
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("recherche tolérante aux fautes", async ({ page }) => {
    await page.goto("/search?q=gobelt");
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("navigation catégorie, filtres et tri", async ({ page }) => {
    await page.goto("/c/hygiene");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();
    await page.getByLabel("En stock uniquement").click();
    await page.waitForURL(/stock=1/);
    await page.getByLabel("Trier par").selectOption("price_asc");
    await page.waitForURL(/sort=price_asc/);
    const prices = await page.locator("article .t-price").allTextContents();
    expect(prices.length).toBeGreaterThan(1);
    await page.getByRole("link", { name: "Réinitialiser les filtres" }).first().click();
    await page.waitForURL((u) => !u.search.includes("stock=1"));
  });

  test("pagination et compteur", async ({ page }) => {
    await page.goto("/c");
    await expect(page.getByText(/produits$/).first()).toBeVisible();
    const next = page.getByRole("link", { name: "Page suivante" });
    if (await next.isVisible()) {
      await next.click();
      await page.waitForURL(/page=2/);
      await expect(page.locator("article").first()).toBeVisible();
    }
  });

  test("page produit : paliers, quantité, prix recalculé", async ({ page }) => {
    await page.goto("/c");
    await page.locator("article a[href^='/p/']").first().click();
    await page.waitForURL(/\/p\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Prix dégressifs").first()).toBeVisible();
    const total = page.getByText("Total ligne").locator("..").locator(".t-price-lg");
    const before = await total.textContent();
    await page.getByRole("button", { name: "Augmenter la quantité" }).first().click();
    await expect(total).not.toHaveText(before ?? "");
    await expect(page.getByRole("button", { name: "Ajouter au panier" }).first()).toBeEnabled();
  });

  test("pages marques, activités, promotions, nouveautés, 404", async ({ page }) => {
    for (const path of ["/brands", "/professionnels", "/promotions", "/nouveautes", "/guides", "/faq"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    await page.goto("/p/reference-inexistante");
    await expect(page.getByText("Cette référence semble avoir quitté l'entrepôt.")).toBeVisible();
  });
});
