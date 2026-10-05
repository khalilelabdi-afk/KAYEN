import { chromium } from "@playwright/test";
const out = "/tmp/claude-0/-home-user-KAYEN/fd9d6f00-5edb-5815-b82e-60c3b6cc19c1/scratchpad/shots";
const base = "http://localhost:3000";
const [path, tag, w, h, ...offsets] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: Number(w), height: Number(h) }, locale: "fr-FR" });
const page = await ctx.newPage();
await page.goto(base + path, { waitUntil: "networkidle" });
for (const off of offsets) {
  await page.evaluate((y) => window.scrollTo(0, y), Number(off));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${tag}-${off}.png` });
}
await browser.close();
