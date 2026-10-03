// CIERRE-TRAMO-01 · A1 (H) · las dos webs de prueba cargadas por las casillas con todo lo que la página lee de su plantilla.
// Sesión A (2026-10-03): test rojo.
//
// o-ter, u y v: lo que se aprueba es que cada hueco esté migrado y se pueda cargar por la ficha. Medido por A el 2026-10-03
// (`C:/t/ct01/medir-carga.mjs`, sólo `.get()`): la web A no tiene 56 hojas de su fixture y difiere en 44; la C, 131 y 40; y los tenants
// de las plantillas —la referencia de `e2e.mjs` (D-100)— tampoco están al día (A 34, C 81 hojas faltantes) (D-214).
// Qué se compara (D-215): (1) el tenant de cada plantilla tiene cada hoja del fixture del commit de T que se cargó; (2) la web coincide
// con ese tenant en cada hoja de los dos —también lo que el alta y `b4-tenant` escriben igual: `features`, `splash`, `businessRules`…—,
// salvo, por nombre y con su porqué, las urls de Storage (por el sha256 de sus bytes: cada web guarda bajo su id; una ruta distinta con
// los mismos bytes se imprime con `t.diagnostic`, como LOGO-01 en E2E-01), lo derivado, las superficies que la variante fija, el nombre
// de la web de demo, `status`, `palette` y `adminEmail`. Comparar contra el TENANT (y el tenant contra el fixture) cubre lo que no está
// en el fixture pero la página lee de los dos lados.
// Condición del árbol (inciso l, como D-99): el registro `tests/e2e-01-webs.json` declara la carga de esta orden por web —`carga.orden` y
// `carga.fixtureT`, un commit de T que contiene esta orden—; en el rojo no la declara y cae sin leer Firestore.
// Todo en LECTURA: el Admin SDK de H sólo hace `.get()` de `config/{id}` y los GET sólo descargan. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ORDEN, PALETAS, RAIZ_T, WEBS, desciende, git, hojas, leerDoc, registro, rojoDe, shaDeUrl } from "./_comun.ts";

/** Lo que no se carga aunque difiera, con su porqué (D-215). */
const EXCLUIDAS: [RegExp, string][] = [
  [/^branding\.heroToBackdrop(\.|$)/, "derivado (transicion.mjs, D-90)"],
  [/^branding\.paletteMeta\.(derivedAt|mode)$/, "derivado: el instante de la derivación; el modo va en branding.mode (E2E-01)"],
  [/^sections\.(team|testimonials|faq|instagram|contact)\.surface$/, "la variante fija el fondo (D6, D-197)"],
  [/^(business|brand)\.name$/, "el nombre de la web de demo"],
  [/^status$/, "el tenant de la plantilla es demo"],
  [/^palette(\.|$)/, "la nota de diseño del fixture: la página no la lee"],
  [/^adminEmail$/, "lo escribe b4-tenant; sólo lo lee el CRM"],
];
const excluida = (k: string) => EXCLUIDAS.some(([re]) => re.test(k));
const STORAGE = "https://firebasestorage.googleapis.com/";
const deStorage = (json: string | undefined) => { if (!json) return null; const v = JSON.parse(json); return typeof v === "string" && v.startsWith(STORAGE) ? v : null; };

test("las dos webs de prueba quedan cargadas por las casillas con todo lo que la página lee de su plantilla: `tests/e2e-01-webs.json` declara para cada una la carga de esta orden (`carga.orden` «cierre-tramo-01» y `carga.fixtureT`, un commit de T que contiene esta orden); el tenant de cada plantilla (`config/test-b4-peluqueria-<p>`) tiene cada hoja del fixture de ese commit; y el `config/{id}` de cada web coincide con el tenant de su plantilla en cada hoja de los dos, salvo las urls de Storage —que se comparan por el sha256 de sus bytes—, lo derivado (`branding.heroToBackdrop`, `branding.paletteMeta.derivedAt` y `.mode`), las superficies que la variante fija (`sections.team|testimonials|faq|instagram|contact.surface`), el nombre de la web de demo (`business.name`, `brand.name`), `status`, `palette` y `adminEmail`", async (t) => {
  // (1) Condición del árbol: el registro declara la carga de esta orden. Hoy no: aquí está el rojo.
  const webs = registro().webs;
  const rojoT = rojoDe(RAIZ_T, ORDEN);
  assert.ok(rojoT, `precondición: T tiene el commit rojo de ${ORDEN}`);
  for (const p of PALETAS) {
    const w = webs.find((x) => x.paleta === p);
    assert.ok(w, `precondición: ${WEBS} declara la web ${p}`);
    assert.equal(w!.carga?.orden, ORDEN, `${WEBS}: la web ${p} declara la carga de esta orden (carga.orden «${ORDEN}»; hoy: ${JSON.stringify(w!.carga ?? null)})`);
    assert.ok(w!.carga?.fixtureT && desciende(RAIZ_T, rojoT, w!.carga.fixtureT), `${WEBS}: la carga de la web ${p} es la del fixture de un commit de T que contiene ${ORDEN} (fixtureT ${w!.carga?.fixtureT})`);
  }

  // (2) El tenant contra el fixture, y la web contra el tenant: se juntan todas las diferencias antes de afirmar.
  const malas: string[] = [];
  for (const p of PALETAS) {
    const w = webs.find((x) => x.paleta === p)!;
    const fixture = JSON.parse(git(RAIZ_T, "show", `${w.carga!.fixtureT}:dev-fixtures/peluqueria-paleta-${p}.json`));
    const tenant = await leerDoc("config", `test-b4-peluqueria-${p}`);
    const web = await leerDoc("config", w.clientId);
    assert.ok(tenant && web, `precondición: existen config/test-b4-peluqueria-${p} y config/${w.clientId}`);
    const hf = hojas(fixture), ht = hojas(tenant), hw = hojas(web);
    for (const [k, v] of hf) if (ht.get(k) !== v) malas.push(`${p} · tenant · ${k}: fixture ${v.slice(0, 90)} · tenant ${(ht.get(k) ?? "(falta)").slice(0, 90)}`);
    for (const k of [...new Set([...ht.keys(), ...hw.keys()])].sort()) {
      if (excluida(k)) continue;
      const vt = ht.get(k), vw = hw.get(k);
      if (vt === vw) continue;
      const ut = deStorage(vt), uw = deStorage(vw);
      if (ut && uw) {
        if ((await shaDeUrl(ut)) === (await shaDeUrl(uw))) { t.diagnostic(`${p} · ${k}: los mismos bytes en otra url (${uw.split("/o/")[1]?.split("?")[0]})`); continue; }
        malas.push(`${p} · web · ${k}: otros bytes que la plantilla`);
        continue;
      }
      malas.push(`${p} · web · ${k}: tenant ${(vt ?? "(falta)").slice(0, 90)} · web ${(vw ?? "(falta)").slice(0, 90)}`);
    }
  }
  assert.deepEqual(malas, [], `las dos webs y sus plantillas: ${malas.length} hojas distintas\n${malas.join("\n")}`);
});
