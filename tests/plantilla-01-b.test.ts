// PLANTILLA-01 · copia promovida (VENTA-01, 2026-10-06, D-270) de tests/orden/plantilla-01/b.test.ts. La orden quedó aprobada por
// Liam el 2026-10-06 (T 3222922 · H 96cef4b) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte: entera (ninguna de sus afirmaciones sale a la red: Firestore y Storage en memoria, el cliente de Anthropic falso).
// PLANTILLA-01 · B1, B2 (H) · los textos por consola, sin API y con los mismos validadores (inciso y, D-257). Sesión A (2026-10-05): rojo.
//
// Liam (2026-10-05): sin API de Anthropic (no la quiere pagar), los textos los escribe Claude Code en la consola; el botón de la ficha
// queda, pero no se usa. `exportar` saca, por idioma, lo que Claude Code necesita para escribir: cada ruta de `camposDeTexto` con sus
// límites, la descripción y el `system` que ya usa `escribirTextos` y los datos de la clienta (su web en el idioma base y sus notas), sin
// escribir una segunda versión de ninguna de esas piezas. `aplicar` pasa la propuesta por `validarPropuesta` y `cuerpoDePropuesta`: en seco
// dice, campo por campo, qué entra y qué sale como error y por qué; escribe sólo con `aplicar`, por `guardarConfig` (la lógica del PUT,
// D-255). Ninguna ruta de dato llega a Firestore.
// Caja negra: `exportarTextos` / `aplicarTextos` de H por `import()` dinámico con un Firestore EN MEMORIA, y `escribirTextos` con el
// cliente de Anthropic FALSO (ningún test sale a la API). Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLIENTE, clienteFalso, cumplidor, dbFalsa, existe, fixture, fuente, importarModulo, porJson, type Cfg, type Issue } from "./orden/plantilla-01/_comun.ts";

const MODULO = "src/lib/textos-consola.ts";
const SCRIPT = "scripts/textos.ts";
const NOTAS = "פתוחות מאז 2011. עובדות רק בתיאום מראש.";

/** El cliente de B1 y B2: el fixture A sin capas y con el hero sin eyebrow ni sufijo (lo que deja desde-plantilla), en un Firestore en memoria. */
async function cliente() {
  const { translations: _t, ...config } = fixture("a");
  delete config.hero.eyebrow; delete config.hero.titleSuffix;
  const hub = { clientId: CLIENTE, niche: "peluqueria", language: "he", businessName: config.brand.name };
  return { config: porJson(config) as Cfg, w: await dbFalsa({ [`config/${CLIENTE}`]: config, [`hub_clients/hubDocAzar0001`]: hub }) };
}
async function modulo() {
  assert.ok(existe(MODULO), `falta ${MODULO} (D-257): hoy los textos sólo se escriben con la API, desde la ficha`);
  return importarModulo(MODULO);
}

test("exportar da, por idioma, cada ruta de camposDeTexto con sus límites, su descripción y el system que ya usa escribirTextos, y los datos de la clienta (su web en el idioma base, sin urls, y sus notas) que escribirTextos le manda al modelo, con el nicho, el idioma base y las variantes; ninguna ruta de dato; no escribe nada; y scripts/textos.ts es su consola", async () => {
  const m = await modulo();
  assert.equal(typeof m.exportarTextos, "function", `${MODULO} exporta exportarTextos`);
  const { config, w } = await cliente();
  const exp = (await m.exportarTextos({ clientId: CLIENTE, notas: NOTAS }, { db: w.db })) as Cfg;
  assert.equal(w.escrituras.length + w.agregados.length, 0, "exportar no escribe");
  assert.equal(exp.niche, "peluqueria", "el nicho");
  assert.equal(exp.base, "he", "el idioma base (el de la ficha)");
  for (const s of ["hero", "services", "team"]) assert.equal(exp.variantes?.[s], s === "hero" ? config.hero?.variant : config.sections?.[s]?.variant, `la variante de ${s}`);

  // Las mismas piezas que escribirTextos: lo que pide cada llamada (system, rutas, descripción) y lo que le manda (los datos).
  const tc = await importarModulo("src/lib/textos-claude.ts");
  const { cliente: falso, pedidos } = clienteFalso(cumplidor);
  await tc.escribirTextos(falso, { config, niche: "peluqueria", base: "he", notas: NOTAS });
  assert.ok(pedidos.length >= 2, `precondición (ARNÉS): escribirTextos hace una llamada por idioma con algo que escribir (${pedidos.length})`);
  const idiomas = (exp.idiomas ?? {}) as Record<string, Cfg>;
  assert.equal(Object.keys(idiomas).length, pedidos.length, `exportar trae los mismos idiomas que escribirTextos pide (${Object.keys(idiomas).join(", ")})`);
  for (const pd of pedidos) {
    const l = Object.keys(idiomas).find((k) => idiomas[k].sistema === pd.system);
    assert.ok(l, `exportar trae, para un idioma, el mismo system que escribirTextos (${pd.system.slice(0, 80)}…)`);
    const campos = (idiomas[l!].campos ?? []) as Cfg[];
    assert.deepEqual(campos.map((c) => c.ruta), pd.rutas, `${l}: las mismas rutas, en el mismo orden`);
    const props = pd.params.output_config.format.schema.properties as Record<string, Cfg>;
    for (const c of campos) assert.equal(c.descripcion, props[c.ruta]?.description, `${l}: ${c.ruta} con la misma descripción (y límite) que el esquema`);
    const esperados = tc.camposDeTexto(config, "peluqueria", l, "he") as Cfg[];
    assert.deepEqual(campos.map(({ descripcion: _d, ...x }) => x), esperados, `${l}: cada campo con los límites de camposDeTexto`);
    const bloque = pd.user.match(/<datos_de_la_clienta>\n([\s\S]*)\n<\/datos_de_la_clienta>/)?.[1];
    assert.ok(bloque, "precondición (ARNÉS): escribirTextos manda los datos en <datos_de_la_clienta>");
    assert.deepEqual(porJson(exp.datos), JSON.parse(bloque!), `${l}: los mismos datos de la clienta que escribirTextos le manda al modelo (exportar es un archivo JSON)`);
  }
  const rutas = Object.values(idiomas).flatMap((x) => (x.campos as Cfg[]).map((c) => String(c.ruta)));
  assert.deepEqual(rutas.filter((r) => /(^|\.)(price|priceMax|duration|mode|id|photoUrl|images|src|phone|email|hours|rating|lang)$/.test(r) || r.startsWith("contact.phone")), [], "ninguna ruta de dato");

  assert.ok(existe(SCRIPT), `falta ${SCRIPT}: la consola de los textos`);
  const s = fuente(SCRIPT);
  assert.match(s, /from ["']\.\.\/src\/lib\/textos-consola\.ts["']/, `${SCRIPT} usa ${MODULO} (no otra versión)`);
  for (const f of ["exportar", "aplicar", "--id", "--archivo", "--notas", "--aplicar"]) assert.ok(s.includes(f), `${SCRIPT} entiende ${f}`);
});

test("aplicar pasa la propuesta por validarPropuesta y cuerpoDePropuesta: en seco dice, para cada campo de la propuesta, si entra o sale como error y por qué, y no escribe; con aplicar escribe sólo lo que entra, por guardarConfig (la lógica del PUT, con su auditoría); una ruta de dato (contact.phone, services.cut.price), un servicio que no existe y un campo que ya tiene texto salen como error y no llegan a Firestore; y un número que sólo está en las notas entra con las notas", async () => {
  const m = await modulo();
  assert.equal(typeof m.aplicarTextos, "function", `${MODULO} exporta aplicarTextos`);
  const { validateConfig } = await importarModulo("src/lib/config-validator.ts");
  const { config, w } = await cliente();
  const propuesta = {
    en: { "hero.subtitle": "Colour and cuts, booked ahead, in a calm room", "services.cut.name": "Cut and consultation", "hero.eyebrow": "Since 2011",
      "contact.phone": "+972 3-000-0009", "services.cut.price": "999", "services.no-existe.name": "Nothing" },
    he: { "hero.subtitle": "טקסט אחר שלא נכנס", "hero.eyebrow": "סטודיו לשיער" },
  };
  const entran = ["en:hero.subtitle", "en:services.cut.name", "en:hero.eyebrow", "he:hero.eyebrow"];
  const salen = ["en:contact.phone", "en:services.cut.price", "en:services.no-existe.name", "he:hero.subtitle"];
  const todas = Object.entries(propuesta).flatMap(([l, t]) => Object.keys(t).map((r) => `${l}:${r}`)).sort();

  // En seco.
  const seco = (await m.aplicarTextos({ clientId: CLIENTE, propuesta, notas: NOTAS }, { db: w.db })) as Cfg;
  assert.equal(w.escrituras.length + w.agregados.length, 0, "en seco no escribe");
  const errores = (seco.errores ?? []) as Issue[];
  assert.deepEqual([...(seco.entran ?? [])].sort(), [...entran].sort(), "en seco: entran justo los textos válidos (con el número de las notas)");
  assert.deepEqual([...new Set(errores.map((e) => e.path))].sort(), [...salen].sort(), "en seco: salen como error la ruta de dato, el precio, el servicio que no existe y el campo que ya tiene texto");
  assert.deepEqual([...new Set([...(seco.entran ?? []), ...errores.map((e) => e.path)])].sort(), todas, "cada campo de la propuesta se dice: entra o sale con su error");
  assert.ok(errores.every((e) => typeof e.message === "string" && e.message.trim()), "cada error dice por qué");

  // Con aplicar.
  const antes = porJson(w.doc("config", CLIENTE) as Cfg);
  const r = (await m.aplicarTextos({ clientId: CLIENTE, propuesta, notas: NOTAS, aplicar: true }, { db: w.db })) as Cfg;
  assert.deepEqual([...(r.entran ?? [])].sort(), [...entran].sort(), "con aplicar entra lo mismo que en seco");
  assert.deepEqual(w.escrituras.map((e) => [e.coleccion, e.id, e.opts?.merge]), [["config", CLIENTE, true]], "un solo set en config/{id}, con merge (como PUT /api/config)");
  assert.ok(w.agregados.some((a) => a.coleccion === `config_history/${CLIENTE}/entries`), "con su entrada en config_history, como el PUT");
  const despues = w.doc("config", CLIENTE) as Cfg;
  assert.equal(despues.translations?.en?.hero?.subtitle, propuesta.en["hero.subtitle"], "en: hero.subtitle guardado");
  assert.equal(despues.translations?.en?.hero?.eyebrow, "Since 2011", "en: el eyebrow con el número de las notas guardado");
  assert.equal(despues.translations?.en?.services?.cut?.name, "Cut and consultation", "en: el nombre del servicio guardado");
  assert.equal(despues.hero?.eyebrow, "סטודיו לשיער", "he: el eyebrow vacío guardado en la raíz");
  assert.equal(despues.hero?.subtitle, config.hero.subtitle, "he: lo que ya tenía texto no se reescribe");
  const sinTexto = (c: Cfg) => { const { translations: _t, hero: _h, ...resto } = c; return resto; };
  assert.deepEqual(sinTexto(despues), sinTexto(antes), "ninguna ruta de dato llegó a Firestore (teléfono, precio, catálogo: iguales)");
  assert.ok(!JSON.stringify(despues).includes("no-existe") && !JSON.stringify(despues).includes("3-000-0009") && !JSON.stringify(despues).includes("טקסט אחר"), "nada de lo que salió como error está en el documento");
  assert.deepEqual((validateConfig(despues) as Issue[]).filter((e) => e.severity === "error").map((e) => `${e.path}: ${e.message}`), [], "el config guardado pasa validateConfig sin errores");
});
