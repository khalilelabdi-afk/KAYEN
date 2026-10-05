import { test, expect } from "@playwright/test";
import { login, ADMIN } from "./helpers";

test.describe("Administration", () => {
  test("tableau de bord, commandes, devis, clients, produits, paramètres", async ({ page }) => {
    await login(page, ADMIN, "/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
    for (const [path, heading] of [
      ["/admin/orders", /Commandes/],
      ["/admin/quotes", /Devis/],
      ["/admin/customers", /Clients/],
      ["/admin/products", /Produits/],
      ["/admin/categories", /Catégories/],
      ["/admin/promotions", /Promotions/],
      ["/admin/inventory", /Stock/],
      ["/admin/homepage", /accueil/i],
      ["/admin/settings", /Paramètres/],
      ["/admin/audit", /audit/i],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    }
  });

  test("validation d'un compte client et traitement d'un devis", async ({ page }) => {
    await login(page, ADMIN, "/admin/customers?status=PENDING");
    const first = page.getByRole("link", { name: /Société E2E/ }).first();
    if (await first.isVisible()) {
      await first.click();
      await page.getByRole("button", { name: "Approuver le compte" }).click();
      await expect(page.getByText("Statut du compte mis à jour").first()).toBeVisible();
    }
    await page.goto("/admin/quotes?status=SUBMITTED");
    const quote = page.locator("table a[href^='/admin/quotes/']").first();
    if (await quote.isVisible()) {
      await quote.click();
      await page.getByRole("button", { name: "Envoyer le devis" }).click();
      await expect(page.getByText("Devis envoyé au client").first()).toBeVisible();
    }
  });
});
