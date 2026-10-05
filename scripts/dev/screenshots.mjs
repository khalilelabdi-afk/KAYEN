import { chromium } from "@playwright/test";
const out = "/tmp/claude-0/-home-user-KAYEN/fd9d6f00-5edb-5815-b82e-60c3b6cc19c1/scratchpad/shots";
const base = "http://localhost:3000";
const pages = [
  ["home", "/"],
  ["plp", "/c/hygiene"],
  ["pdp", "/p/gobelet-carton-expresso-12-cl-carton-de-2000"],
  ["search", "/search?q=nettoyant"],
  ["sector", "/professionnels/hotel"],
  ["quote", "/quote"],
  ["login", "/login"],
  ["cart-empty", "/cart"],
];
const widths = [[375, 812, "m"], [768, 1024, "t"], [1440, 900, "d"]];
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
for (const [w, h, tag] of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: "fr-FR" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[${tag}] ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`[${tag}] pageerror ${e.message}`));
  for (const [name, path] of pages) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${out}/${name}-${tag}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) errors.push(`[${tag}] horizontal overflow on ${path}: ${overflow}px`);
  }
  // mega menu open (desktop) and mobile menu
  if (tag === "d") { await page.goto(base + "/", { waitUntil: "networkidle" }); await page.getByRole("button", { name: "Tous les produits" }).hover(); await page.waitForTimeout(400); await page.screenshot({ path: `${out}/megamenu-d.png` }); }
  if (tag === "m") { await page.goto(base + "/", { waitUntil: "networkidle" }); await page.getByRole("button", { name: "Catégories" }).click(); await page.waitForTimeout(400); await page.screenshot({ path: `${out}/mobilemenu-m.png` }); }
  console.log(tag, errors.length ? errors.join("\n") : "no console errors");
  await ctx.close();
}
await browser.close();
