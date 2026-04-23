import { chromium } from "playwright";

const url = process.env.URL || "http://127.0.0.1:5183/";
const browser = await chromium.launch();
const errors = [];

async function shot(label, viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${label}] console: ${m.text()}`);
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `/tmp/ee-${label}-landing.png`, fullPage: false });
  const start = page.getByRole("button", { name: /initialize link/i }).first();
  if (await start.count()) {
    await start.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/tmp/ee-${label}-play.png`, fullPage: false });
  }
  await page.close();
}

await shot("desktop", { width: 1280, height: 800 });
await shot("mobile", { width: 390, height: 844 });
console.log("ERRORS:", errors.length ? "\n  " + errors.join("\n  ") : "none");
await browser.close();
