// CONEXION-09 · V (H) · el validador del hub después de D-90/D-91 (V1) y «lo que el fixture declara = lo que tiene el tenant» para el
// dato recalculado (V2, inciso n). Sesión A (2026-09-24): tests rojos — `validateReplanteoHuecos` avisa «Hay vídeo del hero y foto del
// local sin la relación hero → fondo escrita» (config-validator.ts:835–837), y el tenant C trae `adjacent-hue` con `dH: 100`, el valor
// que el comodín de `transicion.mjs` inventó el 2026-09-19.
// D-91: el aviso se va porque un cliente real que sube vídeo y foto en el hub NO puede producir ese valor (D-90: sin casilla, y el
// navegador del hub no puede leer los píxeles de Storage) — un aviso sin acción posible es ruido. Lo que sigue siendo ERROR es el
// valor inválido cuando está: `relation`, `mechanism` y `foot.hex`.
// Caja negra: `config-validator.ts` por `import()` dinámico con extensión (es un .ts sin `import.meta.env`), los fixtures de T por la
// ruta fija del hermano, y `b4-tenant.ts show`, que sólo LEE Firestore. Sólo en H (inciso n).
// COPIA PROMOVIDA (E2E-01, 2026-09-25): la carpeta `tests/orden/conexion-09/` queda congelada al aprobarse la orden y ésta es la
// copia editable. Único cambio respecto del original: el import de `_comun.ts` apunta a `./orden/conexion-09/_comun.ts`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CLAVES_RELACION, D93, DERIVADA, RAIZ_H, ROOT, TENANT, VALIDADOR, correrLargo, fixture, get, tenantDe } from "./orden/conexion-09/_comun.ts";

type Issue = { path: string; message: string; severity: "error" | "warning" };
type Cfg = Record<string, unknown>;
/** Un config mínimo con vídeo del hero y foto del local de Storage, y SIN la relación: el caso del aviso que D-91 saca. */
const STORAGE = "https://firebasestorage.googleapis.com/v0/b/barbertemplate-madre.firebasestorage.app/o/x?alt=media&token=t";
const SIN_RELACION: Cfg = {
  business: { type: "peluqueria" },
  hero: { video: { mp4: STORAGE, webm: STORAGE } },
  branding: { localPhoto: STORAGE, localPhotoMobile: STORAGE },
};

/** Bloque «## config (existe)» de la salida de `show`, como JSON (CONEXION-02 lo dejó sin recorte). */
function configDeShow(stdout: string, id: string): Cfg {
  const marca = "## config (existe)";
  const i = stdout.indexOf(marca);
  assert.ok(i >= 0, `show imprime «${marca}» para ${id}:\n${stdout.slice(-1500)}`);
  const resto = stdout.slice(i + marca.length);
  const j = resto.search(/^## /m);
  const texto = (j < 0 ? resto : resto.slice(0, j)).trim();
  try { return JSON.parse(texto) as Cfg; } catch (e) { throw new Error(`show imprime el documento config entero como JSON: ${(e as Error).message}\n…${texto.slice(-300)}`); }
}

test("`validateReplanteoHuecos` sobre un config con `hero.video` y `branding.localPhoto` de Storage y sin `branding.heroToBackdrop` no da ningún aviso ni error con ruta `branding.heroToBackdrop`; con `relation: \"vecino\"` da error en `branding.heroToBackdrop.relation`; y los fixtures A y C de T (el hermano, leídos del disco) no dan ningún error", async () => {
  const m = (await import(pathToFileURL(resolve(ROOT, VALIDADOR)).href)) as { validateReplanteoHuecos: (c: unknown) => Issue[] };
  assert.equal(typeof m.validateReplanteoHuecos, "function", `${VALIDADOR} exporta validateReplanteoHuecos`);

  // (1) Sin la relación, ni aviso ni error: nadie puede escribirla desde el hub (D-90/D-91). Hoy avisa: aquí está el rojo.
  const sin = m.validateReplanteoHuecos(SIN_RELACION);
  const deLaFila = sin.filter((i) => i.path === DERIVADA || i.path.startsWith(`${DERIVADA}.`));
  assert.deepEqual(deLaFila, [], `sin ${DERIVADA} no hay nada que decir (hay ${JSON.stringify(deLaFila)})`);

  // (2) Pero un valor inválido sigue siendo ERROR: el dato se mantiene verdadero (D-91).
  const malo = m.validateReplanteoHuecos({ ...SIN_RELACION, branding: { ...(SIN_RELACION.branding as Cfg), heroToBackdrop: { relation: "vecino", mechanism: "veil-from-first-pixel", foot: { hex: "#112233" } } } });
  const rel = malo.filter((i) => i.path === `${DERIVADA}.relation`);
  assert.equal(rel.length, 1, `«vecino» da un error en ${DERIVADA}.relation (hay ${JSON.stringify(malo.map((i) => `${i.severity} · ${i.path}`))})`);
  assert.equal(rel[0].severity, "error", `…y es error, no aviso (dio «${rel[0].severity}»)`);

  // (3) Y los dos fixtures reales de T pasan sin un solo error.
  for (const p of ["a", "c"] as const) {
    const errores = m.validateReplanteoHuecos(fixture(p)).filter((i) => i.severity === "error");
    assert.deepEqual(errores, [], `el fixture ${p.toUpperCase()} de T sin errores (hay ${JSON.stringify(errores.map((i) => `${i.path}: ${i.message}`))})`);
  }
});

test("`scripts/b4-tenant.ts show --id test-b4-peluqueria-a` y `--id test-b4-peluqueria-c` (con Firestore, sólo lectura) devuelven un `branding.heroToBackdrop` igual al del fixture de T de su paleta, con A `same-hue` y `footPortrait.hex` `#908b8a`, y C `same-hue-different-light` con `scrim-dies-into-photo`", () => {
  assert.ok(existsSync(join(RAIZ_H, ".env.local")), `falta ${RAIZ_H}/.env.local: b4-tenant.ts show no puede leer Firestore (el test no se salta)`);
  for (const p of ["a", "c"] as const) {
    const id = tenantDe(p);
    const show = correrLargo(["--experimental-strip-types", TENANT, "show", "--id", id], { cwd: RAIZ_H });
    assert.equal(show.status, 0, `b4-tenant.ts show --id ${id} sale 0 (salió ${show.status})\n${show.out.slice(-3000)}`);
    const tenant = configDeShow(show.stdout, id);
    const enTenant = get(tenant, DERIVADA) as Record<string, unknown> | undefined;
    assert.ok(enTenant && typeof enTenant === "object", `el tenant ${id} tiene ${DERIVADA} (hay ${JSON.stringify(enTenant)})`);

    // (1) La relación y el mecanismo que D-93 midió. Hoy el tenant C trae `adjacent-hue`: aquí está el rojo.
    assert.equal(enTenant.relation, D93[p].relation, `el tenant ${id}: relation = ${D93[p].relation} (hay ${JSON.stringify(enTenant.relation)})`);
    assert.equal(enTenant.mechanism, D93[p].mechanism, `el tenant ${id}: mechanism = ${D93[p].mechanism} (hay ${JSON.stringify(enTenant.mechanism)})`);

    // (2) Y es exactamente lo que declara el fixture de su paleta, clave por clave.
    const enFixture = get(fixture(p), DERIVADA) as Record<string, unknown> | undefined;
    assert.ok(enFixture && typeof enFixture === "object", `precondición: el fixture ${p.toUpperCase()} de T declara ${DERIVADA}`);
    assert.deepEqual(enTenant, enFixture, `el ${DERIVADA} del tenant ${id} = el del fixture ${p.toUpperCase()}`);
    for (const clave of CLAVES_RELACION) assert.ok(clave in enFixture, `${p}: el fixture declara «${clave}»`);
  }
  // (3) El pie 9:16 de A, medido por el revisor (D-93): el guardado hoy es `#908e92`.
  const a = get(fixture("a"), DERIVADA) as Record<string, unknown>;
  assert.equal((a.footPortrait as Record<string, unknown> | undefined)?.hex, D93.a.footPortraitHex, `A: footPortrait.hex = ${D93.a.footPortraitHex}`);
  assert.equal(resolve(ROOT), resolve(RAIZ_H), "precondición: este test corre en H");
});
