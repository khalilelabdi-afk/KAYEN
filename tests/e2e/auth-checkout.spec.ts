import { test, expect } from "@playwright/test";
import { login, addFirstProductToCart, DEMO, ADMIN } from "./helpers";

test.describe("Compte et commande", () => {
  test("inscription d'un compte professionnel", async ({ page }) => {
    const email = `e2e-${Date.now()}@kayen.local`;
    await page.goto("/register");
    await page.getByLabel("Prénom").fill("Test");
    await page.getByLabel("Nom", { exact: true }).fill("E2E");
    await page.getByLabel("Email professionnel").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill("Password123!");
    await page.getByLabel("Confirmer le mot de passe").fill("Password123!");
    await page.getByLabel("Nom de l'entreprise").fill("Société E2E");
    await page.getByLabel(/J'accepte les conditions/).check();
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await page.waitForURL(/\/register\/success/);
    await expect(page.getByRole("heading", { name: "Bienvenue chez KAYEN" })).toBeVisible();
  });

  test("connexion avec mauvais mot de passe puis succès", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(DEMO.email);
    await page.getByLabel(/mot de passe/i).fill("mauvais");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Email ou mot de passe incorrect")).toBeVisible();
    await login(page);
    await expect(page.getByText(/Bonjour/)).toBeVisible();
  });

  test("parcours panier → checkout → confirmation (carte mock)", async ({ page }) => {
    test.slow();
    await login(page, DEMO, "/c");
    await addFirstProductToCart(page);
    await page.goto("/cart");
    await page.getByRole("link", { name: "Passer la commande" }).click();
    await page.waitForURL(/\/checkout$/);
    await page.getByRole("button", { name: "Continuer vers la livraison" }).click();
    await page.waitForURL(/\/checkout\/shipping/);
    await page.getByRole("button", { name: "Continuer vers le paiement" }).click();
    await page.waitForURL(/\/checkout\/payment/);
    await page.getByLabel("Nom sur la carte").fill("Camille Durand");
    await page.getByLabel("Numéro de carte").fill("4242424242424242");
    await page.getByLabel(/Expiration/).fill("12/30");
    await page.getByLabel("CVC").fill("123");
    await page.getByLabel(/J'accepte les conditions/).check();
    await page.getByRole("button", { name: /Confirmer la commande/ }).click();
    await page.waitForURL(/\/checkout\/confirmation\//, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Merci, votre commande est enregistrée" })).toBeVisible();
    await page.getByRole("link", { name: "Voir ma commande" }).click();
    await page.waitForURL(/\/account\/orders\//);
    await expect(page.getByRole("button", { name: "Commander à nouveau" })).toBeVisible();
  });

  test("demande de devis depuis un produit", async ({ page }) => {
    await page.goto("/c");
    await page.locator("article a[href^='/p/']").first().click();
    await page.waitForURL(/\/p\//);
    await page.locator("main").getByRole("link", { name: "Demander un devis" }).and(page.locator("[href*='sku=']")).first().click();
    await page.waitForURL(/\/quote\?sku=/);
    await page.getByLabel("Société").fill("Société E2E");
    await page.getByLabel("Nom du contact").fill("Test E2E");
    await page.getByLabel("Email").fill("e2e-quote@kayen.local");
    await page.getByLabel(/J'accepte d'être contacté/).check();
    await page.getByRole("button", { name: "Envoyer la demande de devis" }).click();
    await page.waitForURL(/\/quote\/success/);
    await expect(page.getByRole("heading", { name: "Demande envoyée" })).toBeVisible();
  });

  test("accès admin refusé aux clients et autorisé à l'admin", async ({ page }) => {
    await login(page, DEMO, "/account");
    await page.goto("/admin");
    await page.waitForURL(/\/account/);
    const logout = await page.request.post("/api/auth/logout");
    expect(logout.ok()).toBeTruthy();
    await page.goto("/account");
    await page.waitForURL(/\/login/);
    await login(page, ADMIN, "/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
  });
});
