// LANDING-01 · las imágenes de las demos de la landing, sacadas de las webs reales.
//   node --experimental-strip-types scripts/capturas-demos.ts --barber <url> --tattoo <url> … [--hero <url>] [--out <carpeta>]
// Cada `--<id> <url>` (los ids de src/lib/sites.ts) escribe public/landing/demo-<id>.png: la portada a 1200×630 a 1,5x, el
// marco de la sección Ejemplos. `--hero <url>` escribe public/landing/demo-hero.png: el celular del hero, 360×780 a 3x.
// Sólo lee las webs. Un id que no se pasa conserva su imagen.
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const pares: [string, string][] = [];
let out = join(import.meta.dirname, "../public/landing");
for (let i = 0; i < args.length; i += 2) {
  const [k, v] = [args[i], args[i + 1]];
  if (!k?.startsWith("--") || !v) throw new Error(`argumento sin valor: ${k}`);
  if (k === "--out") out = v;
  else pares.push([k.slice(2), v.startsWith("http") ? v : `https://${v}`]);
}
if (!pares.length) throw new Error("uso: --<id> <url> … [--hero <url>]");

const navegador = await chromium.launch({ args: ["--disable-lcd-text", "--font-render-hinting=none"] });
try {
  for (const [id, url] of pares) {
    const hero = id === "hero";
    const ctx = await navegador.newContext(hero
      ? { viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "he-IL" }
      : { viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1.5, locale: "he-IL" });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    // Que la portada esté armada: el hero a la vista, las fuentes y las imágenes cargadas, y sin splash encima.
    await page.waitForSelector("#hero", { state: "visible", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {}); // un vídeo en loop no deja la red quieta
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].filter((i) => i.getBoundingClientRect().top < innerHeight).map((i) => i.decode().catch(() => {})));
    });
    await page.waitForFunction(() => {
      const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return !!e && !e.closest("[class*=splash i],[id*=splash i]");
    }, null, { timeout: 30000 });
    const archivo = join(out, hero ? "demo-hero.png" : `demo-${id}.png`);
    await page.screenshot({ path: archivo });
    console.log(`${archivo} ← ${url}`);
    await ctx.close();
  }
} finally {
  await navegador.close();
}
