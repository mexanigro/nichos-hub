// Genera public/og.png (1200x630) para la landing — texto en hebreo, branding oscuro.
// Uso: node scripts/generate-og.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "..", "public", "og.png");

const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&family=Suez+One&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: #09090b;
    font-family: 'Heebo', sans-serif;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    position: relative; overflow: hidden;
  }
  .glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(91,191,173,0.07) 0%, transparent 70%);
  }
  .topline {
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  }
  .inner { display: flex; flex-direction: column; align-items: center; gap: 18px; z-index: 1; }
  .eyebrow {
    color: rgba(255,255,255,0.55); font-size: 19px; letter-spacing: 1px; font-weight: 500;
  }
  .brand { font-size: 64px; font-weight: 700; color: #fff; letter-spacing: -2px; font-family: 'Suez One', 'Heebo', sans-serif; direction: ltr; }
  .brand .dot { color: #5bbfad; }
  .head {
    font-family: 'Suez One', 'Heebo', serif;
    font-size: 44px; color: #fff; text-align: center; line-height: 1.25; max-width: 980px;
  }
  .head em { font-style: normal; color: #5bbfad; }
  .chips { display: flex; gap: 14px; margin-top: 16px; }
  .chip {
    border: 1px solid rgba(255,255,255,0.16); border-radius: 999px;
    padding: 10px 22px; color: rgba(255,255,255,0.8); font-size: 20px; font-weight: 500;
    background: rgba(255,255,255,0.03);
  }
  .chip.hot { border-color: rgba(91,191,173,0.5); color: #5bbfad; }
  .url { position: absolute; bottom: 30px; color: rgba(255,255,255,0.35); font-size: 17px; letter-spacing: 2px; direction: ltr; }
</style>
</head>
<body>
  <div class="glow"></div>
  <div class="topline"></div>
  <div class="inner">
    <div class="brand">ARZAC<span class="dot">.studio</span></div>
    <div class="head">אתר מקצועי + CRM + סוכן וואטסאפ <em>AI</em><br>לעסקים מקומיים בישראל</div>
    <div class="chips">
      <div class="chip hot">אפס דמי הקמה</div>
      <div class="chip">הכל כלול במנוי חודשי</div>
      <div class="chip">באוויר תוך 72 שעות</div>
    </div>
  </div>
  <div class="url">arzac.studio</div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();
console.log("OG image written to", out);
