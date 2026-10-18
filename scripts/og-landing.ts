/**
 * LANDING-01: genera public/og.png (1200×630), la imagen que aparece al compartir arzac.studio, con la estética de la
 * landing y la cuota de src/lib/pricing.ts. Se vuelve a correr cuando cambia el precio o el texto:
 *   node --experimental-strip-types scripts/og-landing.ts
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { MONTHLY_AMOUNT } from "../src/lib/pricing.ts";

const SALIDA = fileURLToPath(new URL("../public/og.png", import.meta.url));

const A = `<svg viewBox="0 0 120 120" width="64" height="64"><path fill-rule="evenodd" d="M60 12L16 108H36L44 88H76L84 108H104L60 12ZM50 74L60 42L70 74H50Z" fill="#1b1816"/><path d="M60 2C55.8 2 52.5 5.3 52.5 9.5C52.5 15.5 60 22 60 22C60 22 67.5 15.5 67.5 9.5C67.5 5.3 64.2 2 60 2Z" fill="#1b1816"/><circle cx="60" cy="9.5" r="3" fill="#ece7df"/></svg>`;

const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500&family=Heebo:wght@400;500&family=Instrument+Serif:ital@0;1&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #ece7df; color: #1b1816; font-family: Heebo, sans-serif; padding: 72px 88px; display: flex; flex-direction: column; justify-content: space-between; }
  .marca { display: flex; align-items: center; gap: 16px; direction: ltr; justify-content: flex-end; }
  .marca span { font-family: "Instrument Serif", serif; font-size: 40px; }
  .marca em { color: #b3522e; }
  h1 { font-family: "Frank Ruhl Libre", serif; font-weight: 400; font-size: 76px; line-height: 1.05; letter-spacing: -0.01em; }
  h1 em { font-style: normal; color: #b3522e; }
  .pie { display: flex; justify-content: space-between; align-items: flex-end; }
  .precio { font-family: "Frank Ruhl Libre", serif; font-size: 56px; }
  .precio small { font-family: Heebo, sans-serif; font-size: 26px; color: #56504a; margin-inline-start: 10px; }
  .sub { font-size: 26px; color: #56504a; }
</style></head><body>
  <div class="marca"><span>Arzac <em>studio</em></span>${A}</div>
  <h1>בניית אתר לעסק<br><em>עם CRM והתראות במייל</em></h1>
  <div class="pie">
    <div class="precio">${MONTHLY_AMOUNT} ₪<small>לחודש · בלי דמי הקמה</small></div>
    <div class="sub">arzac.studio</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: SALIDA });
await browser.close();
console.log(`og.png escrita (${MONTHLY_AMOUNT} ₪) en ${SALIDA}`);
