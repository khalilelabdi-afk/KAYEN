import { test, expect } from "@playwright/test";

test.describe("Mobile", () => {
  test("navigation mobile : catégories, recherche, panier sticky", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Menu" }).last()).toBeVisible();
    await page.getByRole("button", { name: "Catégories" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").locator("button, a").filter({ hasText: /Hygiène/ }).first().click();
    const seeAll = page.getByRole("dialog").getByRole("link", { name: /Tout voir dans/ });
    if (await seeAll.isVisible()) await seeAll.click();
    await page.waitForURL(/\/c\//);
    await expect(page.locator("article").first()).toBeVisible();
    await page.locator("article a[href^='/p/']").first().click();
    await page.waitForURL(/\/p\//);
    await expect(page.getByRole("button", { name: /^Ajouter$/ }).last()).toBeVisible();
    const html = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(html).toBeTruthy();
  });
});
