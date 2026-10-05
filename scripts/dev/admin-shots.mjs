import { chromium } from "@playwright/test";
const out = "/tmp/claude-0/-home-user-KAYEN/fd9d6f00-5edb-5815-b82e-60c3b6cc19c1/scratchpad/shots";
const base = "http://localhost:3000";
const paths = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "fr-FR" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => errors.push("pageerror " + e.message.slice(0, 200)));
await page.goto(base + "/login", { waitUntil: "networkidle" });
await page.getByLabel(/email/i).fill("admin@kayen.local");
await page.getByLabel(/mot de passe/i).fill("Admin1234!");
await page.getByRole("button", { name: "Se connecter" }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"));
for (const p of paths) {
  const res = await page.goto(base + p, { waitUntil: "load", timeout: 120000 }); await page.waitForTimeout(1500);
  const name = p.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  await page.screenshot({ path: `${out}/admin-${name}.png` });
  console.log(res?.status(), p, (await page.title()).slice(0, 60));
}
console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
