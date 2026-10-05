import { test, expect } from "@playwright/test";
import { login, ADMIN } from "./helpers";

/** Suffixe unique pour pouvoir relancer la suite sans collision de SKU / slug. */
const stamp = Date.now().toString(36).toUpperCase();

test.describe("Administration — catalogue et contenu", () => {
  test.describe.configure({ mode: "serial" });

  test("création d'un produit publié visible en boutique", async ({ page }) => {
    test.slow();
    await login(page, ADMIN, "/admin/products/new");
    await page.locator("#p-name").fill(`Produit E2E ${stamp}`);
    await page.locator("#p-sku").fill(`E2E-${stamp}`);
    await page.locator("#p-category").selectOption({ index: 1 });
    await page.locator("#p-status").selectOption("ACTIVE");
    await page.getByRole("tab", { name: /Variantes et prix/ }).click();
    const variant = page.getByRole("region", { name: "Variante 1" });
    await variant.getByLabel("SKU", { exact: true }).fill(`E2E-${stamp}`);
    await variant.getByLabel("Prix HT", { exact: true }).fill("12,50");
    await page.getByRole("tab", { name: /^Stock/ }).click();
    await page.getByLabel("Quantité", { exact: true }).first().fill("40");
    await page.getByRole("button", { name: "Enregistrer le produit" }).first().click();
    await expect(page.getByText("Produit enregistré").first()).toBeVisible();
    await page.waitForURL(/\/admin\/products\/[a-z0-9]+$/);

    await page.goto(`/p/produit-e2e-${stamp.toLowerCase()}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(`Produit E2E ${stamp}`);
    await expect(page.getByText("12,50 €").first()).toBeVisible();
  });

  test("création d'une catégorie et d'une marque", async ({ page }) => {
    await login(page, ADMIN, "/admin/categories/new");
    await page.locator("#c-name").fill(`Catégorie E2E ${stamp}`);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Catégorie enregistrée").first()).toBeVisible();
    await page.goto("/admin/brands/new");
    await page.locator("#b-name").fill(`Marque E2E ${stamp}`);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Marque enregistrée").first()).toBeVisible();
    await page.goto("/admin/brands");
    await expect(page.getByText(`Marque E2E ${stamp}`).first()).toBeVisible();
  });

  test("ajustement de stock avec journal des mouvements", async ({ page }) => {
    await login(page, ADMIN, `/admin/inventory?q=E2E-${stamp}`);
    const row = page.getByRole("row").filter({ hasText: `E2E-${stamp}` }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Ajuster" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Quantité (+/-)").fill("5");
    await dialog.getByLabel("Commentaire").fill("Réception E2E");
    await dialog.getByRole("button", { name: "Confirmer" }).click();
    await expect(page.getByText("Stock ajusté").first()).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: `E2E-${stamp}` }).first()).toContainText("45");
  });

  test("création d'une promotion sur une catégorie", async ({ page }) => {
    await login(page, ADMIN, "/admin/promotions/new");
    await page.locator("#pr-name").fill(`Promo E2E ${stamp}`);
    await page.locator("#pr-type").selectOption("PERCENTAGE");
    await page.locator("#pr-scope").selectOption("CATEGORY");
    await page.locator("#pr-bps").fill("5");
    await page.locator("[id^='pr-cat-']").first().click();
    await page.locator("#pr-start").fill("2026-01-01T00:00");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Promotion enregistrée").first()).toBeVisible();
    await page.goto("/admin/promotions");
    await expect(page.getByText(`Promo E2E ${stamp}`).first()).toBeVisible();
  });

  test("import CSV : validation puis application", async ({ page }) => {
    test.slow();
    await login(page, ADMIN, "/admin/imports");
    const csv = `sku;name;category_slug;price_ht;moq;stock\nE2E-CSV-${stamp};Produit import ${stamp};assiettes;9,90;6;50\n`;
    await page.locator("#import-file").setInputFiles({ name: "import-e2e.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
    await page.getByRole("button", { name: "Valider le fichier" }).click();
    await page.waitForURL(/\/admin\/imports\/[a-z0-9]+$/);
    await expect(page.getByText("Validé").first()).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Importer 1 ligne/ }).click();
    await expect(page.getByText("Terminé").first()).toBeVisible();

    await page.goto(`/search?q=E2E-CSV-${stamp}`);
    await expect(page.locator("article").first()).toContainText(`Produit import ${stamp}`);
  });

  test("page d'accueil éditable et paramètres", async ({ page }) => {
    await login(page, ADMIN, "/admin/homepage");
    const init = page.getByRole("button", { name: "Initialiser depuis les sections par défaut" });
    if (await init.isVisible()) {
      await init.click();
      await expect(page.getByText("Sections initialisées").first()).toBeVisible();
    }
    await expect(page.getByRole("switch").first()).toBeVisible();

    await page.goto("/admin/settings");
    const hours = page.locator("#st-supportHours");
    const previous = await hours.inputValue();
    await hours.fill("Lun.–ven. 8h30–18h (E2E)");
    await page.getByRole("button", { name: "Enregistrer" }).first().click();
    await expect(page.getByText("Paramètres enregistrés").first()).toBeVisible();
    await page.reload();
    await expect(page.locator("#st-supportHours")).toHaveValue("Lun.–ven. 8h30–18h (E2E)");
    await page.locator("#st-supportHours").fill(previous);
    await page.getByRole("button", { name: "Enregistrer" }).first().click();
    await expect(page.getByText("Paramètres enregistrés").first()).toBeVisible();
  });
});
