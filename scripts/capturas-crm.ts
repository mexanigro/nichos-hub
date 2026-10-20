// LANDING-01 · las capturas del CRM de la landing (public/landing/crm-{m,d}-*.png) salen del CRM real de T, no se dibujan.
// Monta el CRM con el arnés de CRM-03 (`T tests/orden/crm-03/_crm.ts`: Firebase en memoria, sin red, reloj fijo, el salón de
// prueba) y saca cada pantalla en hebreo: celular 390×740 a 2x y computadora 1280×608 a 1,5x (el marco de la landing es 1920/912).
// Cuando el CRM cambie, se vuelve a correr y las capturas quedan al día:
//   node --experimental-strip-types scripts/capturas-crm.ts [--t <ruta de T>]
// No escribe en T: copia el arnés a una carpeta temporal con un enlace a node_modules de T y la borra al terminar.
import { mkdtempSync, readFileSync, writeFileSync, symlinkSync, rmdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const i = process.argv.indexOf("--t");
const T = resolve(i > 0 ? process.argv[i + 1] : join(import.meta.dirname, "../../Nichos/Barber-shop-template-main")).replace(/\\/g, "/");
const OUT = join(import.meta.dirname, "../public/landing");

/** La pestaña de la landing → la del menú del CRM (null: el menú abierto sobre «סקירה»). */
const MOVIL: [string, string | null][] = [["dashboard", "סקירה"], ["calendar", "תורים"], ["customers", "לקוחות"], ["team", "צוות"], ["menu", null]];
const COMPU: [string, string][] = [["overview", "סקירה"], ["appointments", "תורים"], ["payments", "תשלומים"], ["team", "צוות"]];

const tmp = mkdtempSync(join(tmpdir(), "capturas-crm-"));
const nm = join(tmp, "node_modules");
try {
  symlinkSync(join(T, "node_modules"), nm, "junction");
  writeFileSync(join(tmp, "package.json"), '{"type":"module"}');
  const arnes = readFileSync(join(T, "tests/orden/crm-03/_crm.ts"), "utf8")
    .replace('import { ROOT } from "../verdad-02/_util.ts";', `const ROOT = ${JSON.stringify(T)};`)
    .replace("export const DIR = import.meta.dirname;", `export const DIR = ${JSON.stringify(T + "/tests/orden/crm-03")};`)
    .replace("vista: Vista;", "vista: Vista; tam?: { width: number; height: number }; dpr?: number;")
    .replace("const tam = ANCHOS[o.vista];", "const tam = o.tam ?? ANCHOS[o.vista];")
    .replace("deviceScaleFactor: 1,", "deviceScaleFactor: o.dpr ?? 1,");
  if (!arnes.includes("o.dpr ?? 1") || !arnes.includes(`const ROOT = `)) throw new Error("el arnés de CRM-03 cambió: revisar los reemplazos de capturas-crm.ts");
  writeFileSync(join(tmp, "_crm.ts"), arnes);
  const { conCrm, salon, quieta } = await import(pathToFileURL(join(tmp, "_crm.ts")).href);

  // Sin red no cargan las fotos del equipo: se muestran las iniciales. El widget de accesibilidad no entra en la foto.
  const datos = salon(T);
  const cfg = Object.keys(datos).find((k) => k.startsWith("config/"))!;
  datos[cfg].staff = datos[cfg].staff.map((s: any) => ({ ...s, photoUrl: "" }));
  const limpiar = async (page: any) => {
    await page.addStyleTag({ content: "[class*=accessib i],[id*=accessib i],[aria-label*=נגישות]{display:none!important}" });
    await page.evaluate(() => scrollTo(0, 0));
    await quieta(page);
  };

  await conCrm(async (crm: any) => {
    const m = await crm.abrir({ vista: "telefono", tam: { width: 390, height: 740 }, dpr: 2, datos });
    for (const [id, pestana] of MOVIL) {
      if (pestana) await m.ir(pestana);
      else {
        await m.ir("סקירה");
        await m.page.getByRole("button", { name: "תפריט" }).first().click();
        await quieta(m.page);
      }
      await limpiar(m.page);
      await m.page.screenshot({ path: join(OUT, `crm-m-${id}.png`) });
      console.log(`crm-m-${id}.png`);
    }
    await m.cerrar();
    const d = await crm.abrir({ vista: "escritorio", tam: { width: 1280, height: 608 }, dpr: 1.5, datos });
    for (const [id, pestana] of COMPU) {
      await d.ir(pestana);
      await limpiar(d.page);
      await d.page.screenshot({ path: join(OUT, `crm-d-${id}.png`) });
      console.log(`crm-d-${id}.png`);
    }
    await d.cerrar();
  }, T);
} finally {
  try { rmdirSync(nm); } catch { /* sin enlace */ } // el enlace primero, sin recursión: nunca se borra node_modules de T
  rmSync(tmp, { recursive: true, force: true });
}
