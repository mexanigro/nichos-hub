// PLANTILLA-01 · copia promovida (VENTA-01, 2026-10-06, D-270) de tests/orden/plantilla-01/a.test.ts. La orden quedó aprobada por
// Liam el 2026-10-06 (T 3222922 · H 96cef4b) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte: entera (ninguna de sus afirmaciones sale a la red: Firestore y Storage en memoria, el cliente de Anthropic falso).
// PLANTILLA-01 · A1, A2 (H) · crear desde plantilla, por consola (inciso y). Sesión A (2026-10-05): tests rojos.
//
// Liam (2026-10-05): para vender en 3 días con ~2 horas de armado por web, un cliente de peluquería ya creado por el alta toma de la
// plantilla A o C el diseño entero y los textos como punto de partida, sin pisar su identidad (D-252): no se copian las reseñas (serían
// reseñas falsas en la web de una clienta real) ni el equipo (son personas de la plantilla), y los textos que nombran la marca, el lugar o
// las personas de la plantilla se copian VACÍOS (D-253) para que la consola los escriba con los datos de la clienta. Los servicios y
// precios se copian como punto de partida. El material se COPIA al Storage del cliente por `subirMaterial` (el token sale del contenido:
// nunca se comparte una url de la plantilla, D-254). En seco por defecto; escribe sólo con `aplicar` y por `guardarConfig`, la lógica del
// PUT (D-255). Rechaza, sin escribir nada, un id que no existe, uno que no es de peluquería, el tenant de una plantilla y las dos webs de
// prueba de E2E (D-256).
// Caja negra: `desdePlantilla` de H por `import()` dinámico, con un Firestore y un Storage EN MEMORIA inyectados (npm test no sale a la
// red). Sólo en H (inciso n). No escribe nada fuera de la memoria del proceso.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLIENTE, HUB_DOC, PLANTILLAS, bytesDe, deStorage, esConserva, existe, fuente, hojas, importarModulo, leer, mundo, nombresDePlantilla,
  tenantDePlantilla, tokenDe, vaciadosDe, type Cfg, type Issue, type Paleta,
} from "./orden/plantilla-01/_comun.ts";

const MODULO = "src/lib/desde-plantilla.ts";
const SCRIPT = "scripts/desde-plantilla.ts";
const P: Paleta[] = ["a", "c"];
/** Medido por A el 2026-10-05 sobre los fixtures de T 3222922 (D-253): los textos copiados que nombran a cada plantilla. */
const VACIADOS = { a: 5, c: 20 };

async function modulo() {
  assert.ok(existe(MODULO), `falta ${MODULO} (D-256): hoy no hay cómo crear un cliente desde una plantilla`);
  const m = await importarModulo(MODULO);
  assert.equal(typeof m.desdePlantilla, "function", `${MODULO} exporta desdePlantilla`);
  return m.desdePlantilla as (o: Cfg, deps: Cfg) => Promise<Cfg>;
}

test("desde-plantilla en seco (sin aplicar) dice qué copiaría —cada archivo de la plantilla, de clients/<plantilla>/media/<rol>/<nombre> a clients/<id>/media/<rol>/<nombre>— y no escribe nada en Firestore ni en Storage; rechaza, sin escribir, un id que no existe, uno que no es de peluquería, el tenant de una plantilla, las webs de prueba de E2E y una plantilla que no es a ni c; y scripts/desde-plantilla.ts es la consola de esa función, en seco salvo con --aplicar", async () => {
  const desdePlantilla = await modulo();
  for (const p of P) {
    const w = await mundo();
    const tenant = await tenantDePlantilla(p);
    const plan = await desdePlantilla({ clientId: CLIENTE, plantilla: p }, { db: w.db, bucket: w.bucket });
    assert.equal(w.escrituras.length, 0, `${p}: en seco no escribe en Firestore (${w.escrituras.map((e) => `${e.coleccion}/${e.id}`).join(", ")})`);
    assert.equal(w.agregados.length, 0, `${p}: en seco no agrega nada a config_history`);
    assert.equal(w.subidas.length, 0, `${p}: en seco no sube nada a Storage`);
    assert.equal(plan.escrito, false, `${p}: el plan dice que no escribió`);
    // Lo que copiaría: el material de lo que se copia (no el de lo que el cliente conserva: retratos y logos de la plantilla).
    const esperado = [...new Set(hojas(tenant).filter(([r]) => !esConserva(r)).map(([, v]) => deStorage(v)?.path).filter((x): x is string => !!x))].sort();
    assert.ok(esperado.length >= 20, `precondición (ARNÉS): la plantilla ${p} tiene su material en Storage (${esperado.length})`);
    const material = (Array.isArray(plan.material) ? plan.material : []) as Cfg[];
    assert.deepEqual(material.map((m) => m.de).sort(), esperado, `${p}: el plan lista cada archivo de la plantilla que se copia, una vez`);
    for (const m of material) {
      const [, , , rol, nombre] = String(m.de).split("/");
      assert.equal(m.a, `clients/${CLIENTE}/media/${rol}/${nombre}`, `${p}: ${m.de} va a clients/${CLIENTE}/media/${rol}/${nombre}`);
    }
    assert.ok(!material.some((m) => /\/(staff|branding\/logo)/.test(String(m.de))), `${p}: no copia retratos ni logos de la plantilla (son de lo que el cliente conserva)`);
  }

  // Los rechazos: con aplicar y todo, no se escribe nada.
  const w = await mundo();
  const rechaza = async (o: Cfg, nombra: string, que: string) => {
    await assert.rejects(desdePlantilla({ ...o, aplicar: true }, { db: w.db, bucket: w.bucket }), (e: unknown) => e instanceof Error && e.message.includes(nombra), `rechaza ${que} y el mensaje nombra «${nombra}»`);
    assert.equal(w.escrituras.length + w.agregados.length + w.subidas.length, 0, `rechazar ${que} no escribe nada`);
  };
  await rechaza({ clientId: "demo-no-existe-9999", plantilla: "a" }, "demo-no-existe-9999", "un id que no existe");
  await rechaza({ clientId: w.barberia, plantilla: "a" }, w.barberia, "un cliente que no es de peluquería");
  for (const id of Object.values(PLANTILLAS)) await rechaza({ clientId: id, plantilla: "c" }, id, `el tenant de una plantilla (${id})`);
  assert.ok(w.e2e.length === 2, "precondición (ARNÉS): tests/e2e-01-webs.json declara las dos webs de prueba");
  for (const id of w.e2e) await rechaza({ clientId: id, plantilla: "a" }, id, `una web de prueba de E2E (${id}): su config es la línea base de D2`);
  await rechaza({ clientId: CLIENTE, plantilla: "b" }, "b", "una plantilla que no es a ni c");

  // La consola.
  assert.ok(existe(SCRIPT), `falta ${SCRIPT}: la consola de desde-plantilla`);
  const s = fuente(SCRIPT);
  assert.match(s, /from ["']\.\.\/src\/lib\/desde-plantilla\.ts["']/, `${SCRIPT} usa desdePlantilla de ${MODULO} (no otra versión)`);
  for (const f of ["--plantilla", "--id", "--aplicar"]) assert.ok(s.includes(f), `${SCRIPT} entiende ${f}`);
});

test("desde-plantilla con aplicar, desde la plantilla A y desde la C: el config del cliente queda con el diseño y el contenido de la plantilla —variantes, branding, paleta, secciones, catálogo de servicios con sus precios, textos y capas por idioma— y conserva su identidad (negocio, marca, contacto, idioma, adminEmail), su equipo y sus reseñas con sus capas; los textos que nombran la marca, el lugar o las personas de la plantilla quedan vacíos en cada idioma; el material queda copiado en clients/<id>/media/ con los mismos bytes y una url cuyo token sale de esos bytes, y ninguna url apunta a la plantilla; no toca hub_clients, clients ni la plantilla; y el resultado pasa validateConfig sin errores", async () => {
  const desdePlantilla = await modulo();
  const { validateConfig } = await importarModulo("src/lib/config-validator.ts");
  for (const p of P) {
    const w = await mundo();
    const antes = w.inicial[`config/${CLIENTE}`];
    const tenant = await tenantDePlantilla(p);
    const vaciados = vaciadosDe(p, tenant);
    assert.equal(vaciados.length, VACIADOS[p], `precondición (ARNÉS, D-253): la plantilla ${p} tiene ${VACIADOS[p]} textos que la nombran (${vaciados.join(", ")})`);

    const r = await desdePlantilla({ clientId: CLIENTE, plantilla: p, aplicar: true }, { db: w.db, bucket: w.bucket });
    assert.equal(r.escrito, true, `${p}: con aplicar, escribe`);
    const config = w.doc("config", CLIENTE) as Cfg;
    // Escribe por la lógica del PUT (D-255): un set con merge y su entrada de auditoría en config_history.
    const sets = w.escrituras.filter((e) => e.coleccion === "config");
    assert.deepEqual(sets.map((e) => [e.id, e.opts?.merge]), [[CLIENTE, true]], `${p}: un solo set en config/${CLIENTE}, con merge (como PUT /api/config)`);
    assert.ok(w.agregados.some((a) => a.coleccion === `config_history/${CLIENTE}/entries`), `${p}: deja su entrada en config_history/${CLIENTE}/entries, como el PUT`);
    for (const k of [`hub_clients/${HUB_DOC}`, `clients/${CLIENTE}`, `config/${PLANTILLAS.a}`, `config/${PLANTILLAS.c}`]) assert.deepEqual(w.docs.get(k), w.inicial[k], `${p}: ${k} no cambia`);

    // (1) Lo que el cliente conserva: igual que antes, hoja por hoja (también su equipo, sus reseñas y sus capas).
    const conserva = (c: Cfg) => Object.fromEntries(hojas(c).filter(([k]) => esConserva(k)));
    assert.deepEqual(conserva(config), conserva(antes), `${p}: la identidad, el equipo y las reseñas del cliente quedan como estaban`);

    // (2) Lo demás de la plantilla, hoja por hoja: el texto que la nombra, vacío; el material, copiado; el resto, igual.
    for (const [ruta, v] of hojas(tenant)) {
      if (esConserva(ruta)) continue;
      const got = leer(config, ruta);
      // MARCA-01 (D-290, M1-7): la relación hero → fondo de la plantilla describe SU vídeo y SU local: ya no se copia (dato falso).
      if (ruta.startsWith("branding.heroToBackdrop.")) { assert.equal(got, undefined, `${p}: ${ruta} es de la plantilla y no se copia (D-290)`); continue; }
      if (vaciados.includes(ruta)) { assert.ok(got === undefined || got === "", `${p}: ${ruta} nombra a la plantilla y queda vacío (hay «${got}»)`); continue; }
      const s = deStorage(v);
      if (!s) { assert.deepEqual(got, v, `${p}: ${ruta} es de la plantilla y se copia igual`); continue; }
      const [, , , rol, nombre] = s.path.split("/");
      const destino = `clients/${CLIENTE}/media/${rol}/${nombre}`;
      const bytes = w.archivos.get(destino);
      assert.ok(bytes && bytes.equals(bytesDe(s.path)), `${p}: ${s.path} se copió a ${destino} con los mismos bytes`);
      const u = deStorage(got);
      assert.ok(u && u.path === destino && u.bucket === "falso", `${p}: ${ruta} apunta a ${destino} del bucket del hub (hay ${String(got).slice(0, 120)})`);
      assert.equal(u!.token, tokenDe(bytes!), `${p}: el token de ${ruta} sale del contenido copiado (subirMaterial), no de la url de la plantilla`);
    }
    assert.ok(w.subidas.every((x) => x.metadata?.cacheControl === "public, max-age=31536000"), `${p}: cada copia sube por subirMaterial (cacheControl de un año)`);

    // (3) Nada de la plantilla a la vista: ninguna url suya, ningún texto copiado que la nombre.
    const textos = hojas(config).filter(([, v]) => typeof v === "string") as [string, string][];
    assert.deepEqual(textos.filter(([, v]) => v.includes(PLANTILLAS.a) || v.includes(PLANTILLAS.c)).map(([k]) => k), [], `${p}: ninguna url apunta a la plantilla`);
    const nombres = nombresDePlantilla(p);
    const nombran = textos.filter(([k, v]) => !esConserva(k) && !/^(palette|branding\.paletteMeta)\./.test(k) && !/^https?:/.test(v) && nombres.some((n) => v.includes(n)));
    assert.deepEqual(nombran.map(([k]) => k), [], `${p}: ningún texto copiado nombra la marca, el lugar ni las personas de la plantilla`);

    // (4) El resultado pasa la validación del guardado.
    const errores = (validateConfig(config) as Issue[]).filter((e) => e.severity === "error");
    assert.deepEqual(errores.map((e) => `${e.path}: ${e.message}`), [], `${p}: el config del cliente pasa validateConfig sin errores`);
  }
});
