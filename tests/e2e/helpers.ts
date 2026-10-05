import { expect, type Page } from "@playwright/test";

export const DEMO = { email: "demo@kayen.local", password: "Demo1234!" };
export const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@kayen.local", password: process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!" };

export async function login(page: Page, creds = DEMO, next = "/account") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel(/email/i).fill(creds.email);
  await page.getByLabel(/mot de passe/i).fill(creds.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

export async function addFirstProductToCart(page: Page) {
  await page.goto("/c");
  const card = page.locator("article").filter({ has: page.getByRole("button", { name: /^Ajouter —/ }) }).first();
  await expect(card).toBeVisible();
  const name = (await card.getByRole("link").nth(1).textContent())?.trim() ?? "";
  await card.getByRole("button", { name: /^Ajouter —/ }).click();
  await expect(page.getByText("Produit ajouté au panier").first()).toBeVisible();
  return name;
}
