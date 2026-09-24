// PRESET-01 · B (H) · la copia del preset que el hub usa en el alta (B1), el script del tenant de prueba (B2) y «lo que el fixture
// declara = lo que tiene el tenant» (B3, inciso n). Sesión A (2026-09-23): tests rojos — `peluqueria.staff` de
// `niche-presets.he.json` trae `https://instagram.com/noa.color` (B1), `b4-tenant.ts` trae «03-612-4477» (B2), y el tenant
// `test-b4-peluqueria-a` trae las tres cuentas y no tiene `contact.address` (B3).
// D-76: B1 no se conforma con leer el JSON — CARGA el preset hebreo de T (el hermano, por ruta fija, con el cargador de `_comun.ts`)
// y compara contra él, y además llama a `buildProvisionDocs` de verdad para medir lo que el alta COPIA a `config/{id}`, que es por
// donde la cuenta de otra persona llega a un cliente real. B2 lee la fuente del script y mide con `buildProvisionDocs` que el
// teléfono por defecto llega al documento. B3 usa `b4-tenant.ts show`, que sólo LEE Firestore.
// Ningún test escribe en T, en H, en Storage ni en Firestore. Sólo en H (inciso n).
// COPIA PROMOVIDA (CONEXION-09, 2026-09-24): la carpeta `tests/orden/preset-01/` queda congelada y esta copia es la editable. Único
// cambio respecto del original (D-95): se queda con B1 y B2; B3 lee Firestore y una copia promovida no sale a la red en cada
// `npm test` (lo que el fixture declara = lo que tiene el tenant lo sigue midiendo la orden viva de turno).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  INSTAGRAM, NICHO, NICHO_PRESETS, PROVISIONING, RAIZ_T, ROOT, TELEFONO, TENANT,
  cadenas, fuente, get, importarAbsoluto, rutaPreset,
} from "./orden/preset-01/_comun.ts";

type Cfg = Record<string, unknown>;
type Miembro = Record<string, unknown>;
/** Lo que B1 compara miembro a miembro entre el JSON del hub y el preset hebreo de T. */
const CAMPOS = ["id", "name", "schedule"] as const;
/** Lo que el `_provenance` del JSON tiene que nombrar para que se sepa de dónde salió esta versión. */
const PROVENANCE = "PRESET-01";
/** El teléfono que esta orden saca de `b4-tenant.ts` y la calle que no puede quedar (D-86). */
const VIEJOS = ["03-612-4477", "ביאליק"];


test("src/lib/client-config/niche-presets.he.json tiene en `peluqueria.staff` los mismos `id`, `name` y `schedule` que `staff` de `peluqueria.he.ts` de T (el hermano, leído del disco) y ningún miembro con `social`, y su `_provenance` nombra «PRESET-01»", async () => {
  const json = JSON.parse(fuente(NICHO_PRESETS)) as Record<string, unknown>;
  const nicho = json[NICHO] as Record<string, unknown> | undefined;
  assert.ok(nicho, `${NICHO_PRESETS} tiene la clave «${NICHO}»`);
  const staff = (nicho.staff ?? []) as Miembro[];
  assert.ok(Array.isArray(staff) && staff.length > 0, `${NICHO_PRESETS}: ${NICHO}.staff es una lista con miembros`);

  // (1) Ningún miembro con `social`, ni aquí ni en lo que el alta copia. Hoy los tres lo traen: aquí está el rojo.
  const conSocial = staff.map((m, i) => [i, m] as const).filter(([, m]) => m.social !== undefined);
  assert.deepEqual(conSocial.map(([i]) => `${NICHO}.staff[${i}]`), [], `${NICHO_PRESETS}: ningún miembro con «social» (hay ${conSocial.map(([i, m]) => `${i} = ${JSON.stringify(m.social)}`).join(" · ")})`);
  const conIg = cadenas(staff, `${NICHO}.staff`).filter(([, s]) => s.includes(INSTAGRAM));
  assert.deepEqual(conIg.map(([ruta]) => ruta), [], `${NICHO_PRESETS}: ningún string con «${INSTAGRAM}» (hay ${conIg.map(([r, s]) => `${r} = ${s}`).join(" · ")})`);

  // (2) Sigue siendo la copia del preset de T: mismos id, name y schedule, en el mismo orden.
  const abs = join(RAIZ_T, rutaPreset("he"));
  assert.ok(existsSync(abs), `precondición: existe el preset hebreo del hermano (${abs})`);
  const mod = await importarAbsoluto(abs, RAIZ_T);
  const preset = mod.peluqueriaPresetHe as Record<string, unknown>;
  assert.ok(preset && typeof preset === "object", `${rutaPreset("he")} exporta peluqueriaPresetHe`);
  const deT = (preset.staff ?? []) as Miembro[];
  assert.equal(staff.length, deT.length, `${NICHO_PRESETS}: tantos miembros como el preset de T (${staff.length} vs ${deT.length})`);
  for (const [i, m] of staff.entries()) {
    for (const campo of CAMPOS) {
      assert.deepEqual(m[campo], deT[i][campo], `${NICHO}.staff[${i}].${campo} = el del preset de T`);
    }
  }

  // (3) La procedencia lo dice: esta versión la escribió PRESET-01, no el script viejo a ciegas.
  assert.match(String(json._provenance ?? ""), new RegExp(PROVENANCE), `${NICHO_PRESETS}: _provenance nombra «${PROVENANCE}» (hay «${String(json._provenance ?? "").slice(0, 200)}»)`);

  // (4) Y lo que el alta COPIA a config/{id} tampoco lleva cuentas: es el camino por el que llegan a un cliente real.
  assert.ok(existsSync(resolve(ROOT, PROVISIONING)), `precondición: existe ${PROVISIONING}`);
  const prov = (await importarAbsoluto(resolve(ROOT, PROVISIONING), ROOT)) as {
    buildProvisionDocs: (i: Record<string, unknown>) => { config: Cfg };
  };
  assert.equal(typeof prov.buildProvisionDocs, "function", `${PROVISIONING} exporta buildProvisionDocs`);
  const docs = prov.buildProvisionDocs({ businessName: "x", niche: NICHO, mode: "team", slug: "s", domain: "d", language: "he", phone: TELEFONO, email: "", address: "" });
  const copiado = cadenas(docs.config.staff ?? [], "config.staff").filter(([, s]) => s.includes(INSTAGRAM));
  assert.deepEqual(copiado.map(([ruta]) => ruta), [], `el alta no copia cuentas de Instagram a config/{id} (hay ${copiado.map(([r, s]) => `${r} = ${s}`).join(" · ")})`);
});

test("scripts/b4-tenant.ts no contiene «03-612-4477» ni «ביאליק», y `buildProvisionDocs` recibe `+972 3-000-0000` como teléfono por defecto (cuando el fixture no trae `contact.phone`) y en `create`", async () => {
  const src = fuente(TENANT);
  // (1) Ni el teléfono ni la calle del negocio concreto. Hoy están en :66, :88 y :90: aquí está el rojo.
  for (const viejo of VIEJOS) {
    assert.ok(!src.includes(viejo), `${TENANT} no contiene «${viejo}» (D-86)`);
  }
  // (2) Los dos `phone:` que recibe buildProvisionDocs son el genérico: el `??` del modo recrear y el literal de `create`.
  const phones = [...src.matchAll(/^\s*phone:\s*(.+?),\s*$/gm)].map((m) => m[1].trim());
  assert.equal(phones.length, 2, `${TENANT} pasa dos veces «phone:» a buildProvisionDocs (hay ${phones.length}: ${phones.join(" · ")})`);
  assert.equal(phones[0], `contact.phone ?? ${JSON.stringify(TELEFONO)}`, `${TENANT}: el teléfono por defecto del modo recrear es «${TELEFONO}»`);
  assert.equal(phones[1], JSON.stringify(TELEFONO), `${TENANT}: el teléfono de «create» es «${TELEFONO}»`);
  // (3) Y ese valor llega de verdad al documento que el alta escribe (no es sólo texto en el script).
  const prov = (await importarAbsoluto(resolve(ROOT, PROVISIONING), ROOT)) as {
    buildProvisionDocs: (i: Record<string, unknown>) => { config: Cfg };
  };
  const docs = prov.buildProvisionDocs({ businessName: "x", niche: NICHO, mode: "team", slug: "s", domain: "d", language: "he", phone: TELEFONO, email: "", address: "" });
  assert.equal(get(docs.config, "contact.phone"), TELEFONO, `buildProvisionDocs pone «${TELEFONO}» en contact.phone`);
});
