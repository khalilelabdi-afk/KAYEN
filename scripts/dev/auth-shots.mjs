import { chromium } from "@playwright/test";
const out = "/tmp/claude-0/-home-user-KAYEN/fd9d6f00-5edb-5815-b82e-60c3b6cc19c1/scratchpad/shots";
const base = "http://localhost:3000";
const [w, h, tag] = [Number(process.argv[2] ?? 1440), Number(process.argv[3] ?? 900), process.argv[4] ?? "d"];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: "fr-FR" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("pageerror " + e.message));
await page.goto(base + "/login", { waitUntil: "networkidle" });
await page.getByLabel(/email/i).fill("demo@kayen.local");
await page.getByLabel(/mot de passe/i).fill("Demo1234!");
await page.getByRole("button", { name: "Se connecter" }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"));
await page.goto(base + "/c/hygiene", { waitUntil: "networkidle" });
const buttons = page.getByRole("button", { name: /^Ajouter —/ });
await buttons.nth(0).click(); await page.waitForTimeout(800);
await buttons.nth(1).click(); await page.waitForTimeout(800);
for (const [name, path] of [["cart", "/cart"], ["checkout-1", "/checkout"], ["checkout-2", "/checkout/shipping"], ["account", "/account"], ["account-orders", "/account/orders"], ["account-lists", "/account/lists"], ["account-addresses", "/account/addresses"]]) {
  if (name === "checkout-2") { await page.goto(base + "/checkout", { waitUntil: "networkidle" }); await page.getByRole("button", { name: "Continuer vers la livraison" }).click(); await page.waitForURL(/shipping/); }
  else await page.goto(base + path, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/auth-${name}-${tag}.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) errors.push(`overflow ${path}: ${overflow}px`);
}
await page.goto(base + "/checkout/shipping", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Continuer vers le paiement" }).click();
await page.waitForURL(/payment/);
await page.screenshot({ path: `${out}/auth-checkout-3-${tag}.png` });
console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
