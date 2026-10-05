// ALTA-IDIOMAS-01 · A1, A2 (H) · un solo camino que escribe los textos de una web en los cuatro idiomas. Sesión A (2026-10-05): rojo.
//
// Medido por A (D-236): `src/app/api/generate-content/route.ts` es el generador de hoy —Haiku (`claude-haiku-4-5-20251001`), un
// esquema fijo de 22 campos (`OUTPUT_SCHEMA`) en UN idioma, sin peluquería en su lista de nichos, la descripción de la clienta
// pegada dentro del mensaje sin delimitar, la respuesta sacada con una regex y devuelta sin validar— y la pestaña Contenido funde lo
// que vuelve en su estado (`setContent(prev => ({ ...prev, ...generated }))`), así que una clave que Claude invente se guarda con
// «Guardar». Liam (2026-10-05): el camino nuevo REEMPLAZA al viejo para todos los nichos (D-241), con `claude-opus-5-5` (D-239).
// A1 lo lee en el código (punto 1 y punto 7: owner-only y rate limit; la ruta propone, no escribe). A2 lo ejecuta con el cliente de
// Anthropic inyectado (punto 8): una llamada por idioma, y ninguna lleva un texto que otra llamada de la misma corrida escribió
// (R24: cada idioma como original, nunca derivado de otro).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { IDIOMAS, MODELO, ROOT, clienteFalso, cumplidor, existe, fixtureA, fuente, importarModulo, sinCapas } from "./_comun.ts";

const RUTA = "src/app/api/generate-content/route.ts";
const MODULO = "src/lib/textos-claude.ts";

/** Los archivos .ts/.tsx de src (relativos, con «/»). */
function archivosDeSrc(dir = resolve(ROOT, "src"), out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) archivosDeSrc(p, out);
    else if (/\.(ts|tsx)$/.test(n)) out.push(relative(ROOT, p).replace(/\\/g, "/"));
  }
  return out;
}

test("un solo generador: src/app/api/generate-content/route.ts exporta POST envuelto en withOwner, limita con isRateLimited bajo «generate-content», escribe los textos con `escribirTextos` de src/lib/textos-claude.ts, no escribe en Firestore (ni set, update, add ni delete) y ya no tiene el esquema fijo de 22 campos ni Haiku; y en src sólo la pestaña Contenido llama a /api/generate-content", () => {
  // (1) El generador viejo. Hoy sigue ahí: aquí está el rojo.
  assert.ok(existe(RUTA), `${RUTA} sigue siendo el camino (D-241: se reemplaza su contenido, no se abre otro)`);
  const ruta = fuente(RUTA);
  assert.ok(!/OUTPUT_SCHEMA/.test(ruta), `${RUTA} todavía tiene el esquema fijo de 22 campos (OUTPUT_SCHEMA) del generador viejo`);
  assert.ok(!/claude-haiku/.test(ruta), `${RUTA} todavía llama a Haiku (D-239: claude-opus-5-5)`);
  // (2) El camino nuevo.
  assert.ok(existe(MODULO), `falta ${MODULO} (D-242)`);
  assert.match(ruta, /import\s*\{[^}]*\bescribirTextos\b[^}]*\}\s*from\s*["']@\/lib\/textos-claude["']/, `${RUTA} importa escribirTextos de @/lib/textos-claude`);
  assert.match(ruta, /\bescribirTextos\(/, `${RUTA} llama a escribirTextos`);
  // (3) Punto 7: sólo el dueño, y con el límite de los endpoints de H.
  assert.match(ruta, /export\s+const\s+POST\s*=\s*withOwner\(/, `${RUTA}: POST = withOwner(…)`);
  assert.match(ruta, /isRateLimited\([^)]*["']generate-content["']/, `${RUTA}: isRateLimited(…, "generate-content", …)`);
  // (4) Punto 5: la ruta propone; el guardado es el PUT de siempre, con la confirmación del dueño.
  const escritura = ruta.match(/\.(set|update|add|delete)\(/);
  assert.equal(escritura, null, `${RUTA} no escribe en Firestore (encontrado «${escritura?.[0]}»)`);
  // (5) Un solo llamador.
  const llamadores = archivosDeSrc().filter((f) => f !== RUTA && /["'`]\/api\/generate-content["'`]/.test(readFileSync(resolve(ROOT, f), "utf8")));
  assert.deepEqual(llamadores, ["src/components/client-content-tab.tsx"], "sólo la pestaña Contenido llama a /api/generate-content");
});

test("`escribirTextos`, con el cliente de Anthropic inyectado, hace una llamada por idioma con claude-opus-5-5 —cuatro con el fixture A sin capas, cuyo idioma base tiene campos vacíos— y cada una pide exactamente las rutas de `camposDeTexto` de su idioma; y ninguna llamada lleva un texto que otra llamada de la misma corrida escribió", async () => {
  assert.ok(existe(MODULO), `falta ${MODULO} (D-242): no hay dónde inyectar el cliente`);
  const m = await importarModulo(MODULO);
  assert.equal(m.MODELO_TEXTOS, MODELO, `MODELO_TEXTOS es ${MODELO} (D-239)`);
  const config = sinCapas(fixtureA());
  const { cliente, pedidos } = clienteFalso(cumplidor);
  const { propuesta } = await m.escribirTextos(cliente, { config, niche: "peluqueria", base: "he" });

  // (1) Una llamada por idioma, con el modelo de Liam.
  assert.equal(pedidos.length, 4, `cuatro llamadas, una por idioma (hubo ${pedidos.length})`);
  for (const p of pedidos) assert.equal(p.params.model, MODELO, `cada llamada usa ${MODELO} (hubo ${p.params.model})`);
  // (2) Cada idioma salió de UNA llamada, y esa llamada pidió exactamente las rutas de su idioma.
  const deLlamada: Record<string, number> = {};
  for (const l of IDIOMAS) {
    const textos = Object.values((propuesta?.[l] ?? {}) as Record<string, string>);
    assert.ok(textos.length > 0, `la propuesta trae textos en ${l}`);
    const marcas = new Set(textos.map((t) => t.match(/^k(\d+)w/)?.[1]));
    assert.equal(marcas.size, 1, `los textos de ${l} salen de una sola llamada (marcas: ${[...marcas].join(", ")})`);
    deLlamada[l] = Number([...marcas][0]);
    const pedidas = [...pedidos[deLlamada[l] - 1].rutas].sort();
    const campos = (m.camposDeTexto(config, "peluqueria", l, "he") as { ruta: string }[]).map((c) => c.ruta).sort();
    assert.deepEqual(pedidas, campos, `la llamada de ${l} pide las rutas de camposDeTexto(…, "${l}", "he")`);
  }
  assert.equal(new Set(Object.values(deLlamada)).size, 4, "cada idioma, una llamada distinta");
  // (3) R24: ninguna llamada lleva lo que escribió otra.
  for (const [k, p] of pedidos.entries()) {
    const visto = `${p.system}\n${p.user}`;
    for (let j = 1; j <= pedidos.length; j++) {
      if (j === k + 1) continue;
      assert.ok(!visto.includes(`k${j}w`), `la llamada ${k + 1} lleva un texto que escribió la llamada ${j} (R24: cada idioma como original)`);
    }
  }
});
