import { test, expect } from "@playwright/test";
import { addFirstProductToCart } from "./helpers";

test.describe("Panier", () => {
  test("ajout, modification de quantité, suppression", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("panier");
    const line = page.locator("li").filter({ has: page.getByRole("button", { name: "Augmenter la quantité" }) }).first();
    await expect(line).toBeVisible();
    const total = line.locator(".t-price").first();
    const before = await total.textContent();
    await line.getByRole("button", { name: "Augmenter la quantité" }).click();
    await expect(total).not.toHaveText(before ?? "", { timeout: 15_000 });
    await line.getByRole("button", { name: /Retirer/ }).click();
    await expect(page.getByText("Votre panier est vide")).toBeVisible({ timeout: 15_000 });
  });

  test("code promo valide et invalide", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");
    await page.getByPlaceholder("Code promo").fill("CODEINVALIDE");
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByText("Ce code n'est pas valide.").first()).toBeVisible();
  });

  test("ajout rapide via commande rapide", async ({ page }) => {
    await page.goto("/c");
    const sku = (await page.locator("article").first().getByText(/Réf\. /).textContent())?.replace("Réf.", "").trim();
    await page.goto("/quick-order");
    await page.getByPlaceholder("RES-GOB-25CL").first().fill(sku ?? "");
    await page.getByRole("button", { name: "Ajouter au panier" }).click();
    await expect(page.getByText("Résultat")).toBeVisible();
  });
});
