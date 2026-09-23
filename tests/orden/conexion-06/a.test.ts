// CONEXION-06 · A (H) · la casilla de paleta en el constructor (D-69..D-71) y el campo `hero.eyebrow` de la pestaña Contenido (D-72):
// src/components/config-editors/paleta-editor.tsx con `aplicarPaleta` pura (A1) y su render en servidor con niche peluqueria/barberia
// (A2, D-34/D-35), la copia byte a byte de `src/lib/palette.ts` y `src/lib/oklab.ts` en H con su guard de paridad en reposo (A3),
// `validatePalette` (A4), el campo de Contenido (A5) y «lo que la casilla escribe = lo que tiene el tenant» (A6, inciso n).
// Sesión A (2026-09-23): tests rojos — el editor NO existe (A1, A2, A6 caen en el `existsSync`), H no tiene `src/lib/palette.ts` (A3),
// el validador no exporta `validatePalette` (A4) y la sección Hero no tiene `hero.eyebrow` (A5). El editor se importa con extensión por
// el cargador de .tsx de _comun.ts (con resolución de `@/` y de imports sin extensión, § Interfaz). Ningún test escribe: A6 usa
// `b4-tenant.ts show`, que sólo lee; A3 sólo escribe en carpetas temporales propias que borra en `finally`. Sólo en H (A1–A6).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  COMPONENTE, CONTENIDO, COPIAS, DIFERIDA, GUARD_PARIDAD, ID_A, NICHO, OKLAB, ORIGENES, RAIZ_H, RAIZ_T, ROOT, TAB, TENANT, VALIDADOR,
  branding, clon, conTemporal, contiene, correr, correrLargo, fixture, get, importarModulo, meta,
} from "./_comun.ts";

type Cfg = Record<string, unknown>;
type Entrada = { source: string; origin: string; reason: string };
type Casilla = { aplicarPaleta: (config: unknown, entrada: Entrada) => Cfg };
type Issue = { path: string; message: string; severity: "error" | "warning" };

/** Importa la casilla y afirma que exporta lo que la hoja fija (el rojo de hoy cae en el existsSync). */
async function casilla(...necesarias: (keyof Casilla)[]): Promise<Casilla> {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarModulo(COMPONENTE);
  for (const nombre of necesarias) assert.equal(typeof m[nombre], "function", `${COMPONENTE} exporta ${nombre}`);
  return m as unknown as Casilla;
}

/** La entrada de la casilla (lo que pide al usuario) tomada de la meta de un fixture. */
function entradaDe(p: "a" | "c"): Entrada {
  const m = meta(fixture(p));
  return { source: String(m.source), origin: String(m.origin), reason: String(m.reason) };
}
/** El fixture `p` sin lo que la casilla escribe: `branding.colors` y `branding.paletteMeta`. */
function basePelada(p: "a" | "c"): Cfg {
  const f = clon(fixture(p));
  const b = branding(f);
  delete b.colors; delete b.paletteMeta;
  return f;
}
/** Lo que la casilla construye desde la meta del fixture `p` (A1, A6). */
function derivado(m: Casilla, p: "a" | "c"): Cfg {
  return m.aplicarPaleta(basePelada(p), entradaDe(p));
}

/** Bloque «## config (existe)» de la salida de `show`, como JSON (CONEXION-02 lo dejó sin recorte). */
function configDeShow(stdout: string): Cfg {
  const marca = "## config (existe)";
  const i = stdout.indexOf(marca);
  assert.ok(i >= 0, `show imprime «${marca}» para ${ID_A}:\n${stdout.slice(-1500)}`);
  const resto = stdout.slice(i + marca.length);
  const j = resto.search(/^## /m);
  const texto = (j < 0 ? resto : resto.slice(0, j)).trim();
  try { return JSON.parse(texto) as Cfg; } catch (e) { throw new Error(`show imprime el documento config entero como JSON: ${(e as Error).message}\n…${texto.slice(-300)}`); }
}

test("src/components/config-editors/paleta-editor.tsx exporta `aplicarPaleta(config, { source, origin, reason })`, pura, que devuelve un config nuevo con `branding.colors` y `branding.paletteMeta` calculados por `derivePalette` de `src/lib/palette.ts` de H (modo = `branding.mode` o `light`; nicho = `peluqueria`) sin tocar otras claves; aplicada sobre el fixture A sin `branding.colors` ni `branding.paletteMeta`, con el `source`, `origin` y `reason` de su meta, da `branding.colors` igual al de A (deepEqual) y una meta con el mismo `source`, `origin`, `reason` y `niche` y un `derivedAt` ISO; sobre el fixture C (modo `dark`) da `branding.colors` igual al de C; con fuente gris (`#808080`) o `reason` de dos palabras lanza el error de `derivePalette` y no devuelve config", async () => {
  const m = await casilla("aplicarPaleta");
  // A (modo light en disco, D-65) y C (modo dark): los colores del fixture salen de la meta, no de una tabla copiada.
  for (const p of ["a", "c"] as const) {
    const esperado = branding(fixture(p)).colors;
    assert.deepEqual(get(derivado(m, p), "branding.colors"), esperado, `el fixture ${p.toUpperCase()} se reconstruye entero desde su meta (modo ${String(branding(fixture(p)).mode)})`);
  }
  // La meta que escribe: los cuatro campos declarados y la hora de la derivación (no se compara `derivedAt` con el del fixture).
  const entrada = entradaDe("a");
  const metaNueva = get(derivado(m, "a"), "branding.paletteMeta") as Record<string, unknown>;
  const metaA = meta(fixture("a"));
  for (const k of ["source", "origin", "reason"] as const) assert.equal(metaNueva[k], entrada[k], `paletteMeta.${k} = el de la entrada`);
  for (const k of ["source", "origin", "reason"] as const) assert.equal(metaNueva[k], metaA[k], `paletteMeta.${k} = el del fixture A`);
  assert.equal(metaNueva.niche, NICHO, `paletteMeta.niche = ${NICHO}`);
  assert.equal(typeof metaNueva.derivedAt, "string", "paletteMeta.derivedAt es texto");
  assert.equal(new Date(String(metaNueva.derivedAt)).toISOString(), metaNueva.derivedAt, `paletteMeta.derivedAt es una fecha ISO (hay «${String(metaNueva.derivedAt)}»)`);
  // El modo sale de `branding.mode`, y sin él es `light`: A sin modo sigue dando los colores de A (que es light).
  const sinModo = basePelada("a");
  delete branding(sinModo).mode;
  assert.deepEqual(get(m.aplicarPaleta(sinModo, entrada), "branding.colors"), branding(fixture("a")).colors, "sin `branding.mode` el modo es light (respaldo, nunca por nicho)");
  const comoDark = clon(basePelada("a"));
  branding(comoDark).mode = "dark";
  assert.notDeepEqual(get(m.aplicarPaleta(comoDark, entrada), "branding.colors"), branding(fixture("a")).colors, "con `branding.mode` = dark los colores son otros (el modo se lee del config, no se fija)");
  // Pura: no muta la entrada y no toca otras claves.
  const base: Cfg = {
    branding: { mode: "light", texture: "https://u/textura.jpg", localPhoto: "https://u/local.jpg", heroToBackdrop: { relation: "same-hue" } },
    hero: { variant: "v6", eyebrow: "מספרה לנשים" },
    sections: { gallery: { variant: "v6" } },
  };
  const copia = clon(base);
  const p1 = m.aplicarPaleta(base, entrada);
  assert.deepEqual(base, copia, "aplicarPaleta no muta el config de entrada");
  assert.notEqual(p1, base, "devuelve un config nuevo");
  assert.deepEqual(p1.hero, copia.hero, "hero no cambia (el eyebrow es de la pestaña Contenido)");
  assert.deepEqual(p1.sections, copia.sections, "sections no cambia");
  for (const k of ["mode", "texture", "localPhoto", "heroToBackdrop"]) {
    assert.deepEqual(get(p1, `branding.${k}`), get(copia, `branding.${k}`), `branding.${k} no cambia (es de la casilla de fondo, CONEXION-05)`);
  }
  assert.equal(typeof get(p1, "branding.colors"), "object", "escribe branding.colors");
  assert.equal(typeof get(p1, "branding.paletteMeta"), "object", "escribe branding.paletteMeta");
  // Se niega como `derivePalette`: fuente sin croma y porqué corto (T:src/lib/palette.ts:75–81); y no devuelve config.
  const falla = (e: Entrada) => { try { m.aplicarPaleta(basePelada("a"), e); return null; } catch (err) { return err as Error; } };
  const gris = falla({ ...entrada, source: "#808080" });
  assert.ok(gris, "con fuente gris (#808080) lanza y no devuelve config");
  assert.match(gris.message, /negro\/blanco|§ 5\.1/, `el error es el de derivePalette (fuente sin croma): «${gris.message}»`);
  const corto = falla({ ...entrada, reason: "dos palabras" });
  assert.ok(corto, "con un `reason` de dos palabras lanza y no devuelve config");
  assert.match(corto.message, /reason/, `el error es el de derivePalette (porqué obligatorio): «${corto.message}»`);
});

test("`renderToString(<PaletaEditor …>)` con `niche=\"peluqueria\"` y el `branding` de A muestra el color fuente (`#5d7a57`), el select `origin` con sus cinco valores (`logo`, `local`, `instagram`, `eleccion`, `material`), el `reason` de A, el modo que tomará de `branding.mode` (`light`) y una muestra de los colores actuales (al menos `accent` `#5d7a57` y `surface` `#f5f8f4`); con `niche=\"barberia\"` devuelve cadena vacía; y src/components/client-config-tab.tsx monta `PaletaEditor` pasando `niche` y escribe en el mismo `config` que guarda por `/api/config/${clientId}`", async () => {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarModulo(COMPONENTE);
  assert.equal(typeof m.PaletaEditor, "function", `${COMPONENTE} exporta PaletaEditor`);
  const { renderToString } = await import("react-dom/server");
  const { createElement } = await import("react");
  type Props = { niche: string; config: Cfg; setConfig: (...args: unknown[]) => void; clientId: string };
  const Editor = m.PaletaEditor as (props: Props) => ReturnType<typeof createElement>;
  const A = fixture("a");
  const b = branding(A);
  const mA = meta(A);
  const render = (niche: string) => renderToString(createElement(Editor, { niche, config: clon(A), setConfig: () => {}, clientId: "x" }));

  const html = render(NICHO);
  assert.ok(contiene(html, String(mA.source)), `el render con peluquería muestra el color fuente «${String(mA.source)}»`);
  for (const origin of ORIGENES) assert.match(html, new RegExp(`<option[^>]*value="${origin}"`), `el select de origin tiene la opción «${origin}»`);
  assert.match(html, new RegExp(`<option[^>]*value="${String(mA.origin)}"[^>]*selected`), `el select de origin marca el valor de A («${String(mA.origin)}»)`);
  assert.ok(contiene(html, String(mA.reason)), "el render muestra el `reason` de A (el porqué viaja con la paleta)");
  assert.ok(html.includes(String(b.mode)), `el render muestra el modo que tomará de branding.mode («${String(b.mode)}»)`);
  const colores = b.colors as Record<string, string>;
  for (const rol of ["accent", "surface"] as const) assert.ok(contiene(html, colores[rol]), `la muestra de colores actuales incluye ${rol} (${colores[rol]})`);
  // Con barbería, la casilla no se monta (patrón D-35/D-46/D-47/D-67).
  assert.equal(render("barberia"), "", "con niche=barberia el editor devuelve cadena vacía");
  // client-config-tab.tsx monta <PaletaEditor … niche={…} /> y guarda por /api/config/${clientId}.
  const tab = readFileSync(resolve(ROOT, TAB), "utf8");
  assert.ok(tab.includes("/api/config/${clientId}"), `precondición: ${TAB} guarda por /api/config/\${clientId}`);
  const montaje = tab.match(/<PaletaEditor\b[\s\S]*?\/>/);
  assert.ok(montaje, `${TAB} monta <PaletaEditor … />`);
  assert.match(montaje[0], /\bniche=\{/, `el montaje pasa niche:\n${montaje[0]}`);
  assert.match(montaje[0], /\bconfig=\{/, `el montaje pasa el mismo config que se guarda:\n${montaje[0]}`);
});

test("src/lib/palette.ts y src/lib/oklab.ts de H existen y son byte a byte iguales a los de T, y tests/paleta-paridad.test.ts de H lo exige en reposo (con una orden viva en cualquiera de los dos repos imprime «paridad de palette/ diferida: orden viva <id>» y pasa, como el guard de tools/, D-61); con `src/lib/oklab.ts` de H cambiado en un byte y sin órdenes vivas (probado con `HIGIENE_ROOTS` sobre dos temporales) el guard falla nombrando el archivo", () => {
  // Las dos copias, byte a byte (la de T se lee por ruta fija, no se importa).
  for (const f of COPIAS) {
    assert.ok(existsSync(join(RAIZ_H, f)), `no existe H ${f} (D-69: la copia que usan la casilla y el validador)`);
    const h = readFileSync(join(RAIZ_H, f));
    const t = readFileSync(join(RAIZ_T, f));
    assert.ok(t.length > 0, `precondición: T ${f} no está vacío`);
    assert.ok(h.equals(t), `H ${f} debe ser byte a byte igual a T ${f} (H ${h.length} bytes, T ${t.length})`);
  }
  assert.ok(existsSync(resolve(ROOT, GUARD_PARIDAD)), `no existe ${GUARD_PARIDAD}`);
  // Dos raíces temporales con el par de copias: una difiere en un byte de oklab.ts. El guard las toma por HIGIENE_ROOTS.
  const raices = (base: string, vivas: Record<"T" | "H", string[]>): [string, string] => {
    const dirs = { T: join(base, "Barber-shop-template-main"), H: join(base, "Nichos-hub") };
    for (const etiqueta of ["T", "H"] as const) {
      for (const f of COPIAS) {
        const abs = join(dirs[etiqueta], f);
        mkdirSync(join(abs, ".."), { recursive: true });
        const bytes = readFileSync(join(RAIZ_T, f));
        writeFileSync(abs, f === OKLAB && etiqueta === "H" ? Buffer.concat([bytes.subarray(0, bytes.length - 1), Buffer.from("X")]) : bytes);
      }
      const orden = join(dirs[etiqueta], "tests", "orden");
      mkdirSync(orden, { recursive: true });
      writeFileSync(join(orden, "APROBADAS.md"), "# Órdenes aprobadas por Liam\n\n- vieja · aprobada 2026-09-20 · T 0000000 · H 0000000\n");
      for (const id of vivas[etiqueta]) { mkdirSync(join(orden, id), { recursive: true }); writeFileSync(join(orden, id, "HOJA.md"), `# HOJA · ${id}\n`); }
    }
    return [dirs.T, dirs.H];
  };
  const correrGuard = (roots: [string, string]) => correr(["--experimental-strip-types", "--test", GUARD_PARIDAD], { env: { HIGIENE_ROOTS: `${roots[0]};${roots[1]}` } });
  // (1) Sin órdenes vivas y con un byte distinto: falla y nombra el archivo.
  conTemporal((base) => {
    const r = correrGuard(raices(base, { T: [], H: [] }));
    assert.notEqual(r.status, 0, `con oklab.ts distinto en un byte y sin órdenes vivas, ${GUARD_PARIDAD} debe fallar (salió ${r.status})\n${r.out.slice(-2000)}`);
    assert.ok(r.out.includes(OKLAB), `el fallo nombra «${OKLAB}»:\n${r.out.slice(-2000)}`);
    assert.doesNotMatch(r.out, new RegExp(DIFERIDA), `sin órdenes vivas no difiere la exigencia:\n${r.out.slice(-1500)}`);
  });
  // (2) Con una orden viva en uno de los dos, el mismo byte distinto no falla: difiere y lo dice en el TAP.
  conTemporal((base) => {
    const r = correrGuard(raices(base, { T: [], H: ["conexion-99"] }));
    assert.equal(r.status, 0, `con una orden viva el guard debe pasar (salió ${r.status})\n${r.out.slice(-2000)}`);
    assert.ok(r.stdout.includes(`${DIFERIDA} conexion-99`), `el TAP debe decir «${DIFERIDA} conexion-99»:\n${r.stdout.slice(-1500)}`);
  });
});

test("`validatePalette` exportada de src/lib/config-validator.ts da **error** cuando `branding.colors` existe sin `branding.paletteMeta`, cuando la meta no deriva (fuente sin croma o `reason` corto) y cuando `branding.colors` no coincide con `derivePalette(meta, branding.mode)` («editada a mano», nombra la primera clave distinta); los fixtures A y C pasan sin errores; A con `branding.colors.text` igual a `branding.colors.surface` da un error con path `branding.colors.text`", async () => {
  const mod = (await import(pathToFileURL(resolve(ROOT, VALIDADOR)).href)) as { validatePalette?: (c: unknown) => Issue[] };
  assert.equal(typeof mod.validatePalette, "function", `${VALIDADOR} exporta validatePalette`);
  const validar = mod.validatePalette as (c: unknown) => Issue[];
  const errores = (c: unknown) => validar(c).filter((i) => i.severity === "error");
  // Los fixtures reales derivan exactos: pasan sin errores (medido por el revisor, 0 claves distintas en A y en C).
  for (const p of ["a", "c"] as const) {
    assert.deepEqual(errores(fixture(p)), [], `el fixture ${p.toUpperCase()} no da errores de paleta`);
  }
  // Colores sin meta: no hay con qué comprobar que los derivó la función.
  const sinMeta = clon(fixture("a"));
  delete branding(sinMeta).paletteMeta;
  const eSinMeta = errores(sinMeta);
  assert.ok(eSinMeta.length > 0, "`branding.colors` sin `branding.paletteMeta` es error");
  assert.ok(JSON.stringify(eSinMeta).includes("paletteMeta"), `el error nombra «paletteMeta»: ${JSON.stringify(eSinMeta)}`);
  // Meta que no deriva: fuente sin croma y porqué corto (los dos casos en los que derivePalette se niega).
  for (const [clave, valor] of [["source", "#808080"], ["reason", "dos palabras"]] as const) {
    const c = clon(fixture("a"));
    (branding(c).paletteMeta as Record<string, unknown>)[clave] = valor;
    assert.ok(errores(c).length > 0, `una meta con ${clave} = «${valor}» no deriva: es error`);
  }
  // Editada a mano: un rol cambiado a un hex que derivePalette no habría dado, y el error nombra la primera clave distinta.
  const aMano = clon(fixture("a"));
  (branding(aMano).colors as Record<string, string>).accent = "#000000";
  const eMano = errores(aMano);
  assert.ok(eMano.length > 0, "`branding.colors` que no coincide con derivePalette(meta, mode) es error (CH:11: «nunca a mano»)");
  assert.ok(JSON.stringify(eMano).includes("accent"), `el error nombra la primera clave distinta («accent»): ${JSON.stringify(eMano)}`);
  // Y el caso de la hoja: el texto igual al fondo (primera clave distinta: `text`), con su path.
  const plano = clon(fixture("a"));
  const colores = branding(plano).colors as Record<string, string>;
  colores.text = colores.surface;
  const ePlano = errores(plano);
  assert.ok(ePlano.some((i) => i.path === "branding.colors.text"), `A con colors.text = colors.surface da un error con path branding.colors.text: ${JSON.stringify(ePlano)}`);
});

test("la pestaña Contenido edita `hero.eyebrow`: src/components/client-content-tab.tsx tiene en la sección Hero un campo `{ path: \"hero.eyebrow\", … }` antes de `hero.titlePrefix`, para todos los nichos, y `validateVariantContracts` sigue avisando con más de 4 palabras", async () => {
  const fuente = readFileSync(resolve(ROOT, CONTENIDO), "utf8");
  // La sección Hero: desde su `key: "hero"` hasta la siguiente `key: "…"`.
  const i = fuente.search(/key:\s*"hero"/);
  assert.ok(i >= 0, `${CONTENIDO} debe tener la sección con key: "hero"`);
  const resto = fuente.slice(i + 12);
  const j = resto.search(/key:\s*"/);
  const hero = j < 0 ? resto : resto.slice(0, j);
  const iEyebrow = hero.search(/path:\s*"hero\.eyebrow"/);
  const iPrefijo = hero.search(/path:\s*"hero\.titlePrefix"/);
  assert.ok(iEyebrow >= 0, `la sección Hero de ${CONTENIDO} no tiene un campo con path: "hero.eyebrow":\n${hero.slice(0, 900)}`);
  assert.ok(iPrefijo >= 0, `precondición: la sección Hero tiene path: "hero.titlePrefix"`);
  assert.ok(iEyebrow < iPrefijo, `el campo de hero.eyebrow va antes que el de hero.titlePrefix (eyebrow en ${iEyebrow}, titlePrefix en ${iPrefijo})`);
  // Para todos los nichos (D-72): la línea del campo no lo condiciona a ninguno.
  const linea = hero.split(/\r?\n/).find((l) => /path:\s*"hero\.eyebrow"/.test(l)) ?? "";
  assert.doesNotMatch(linea, /niche|peluqueria|barberia/, `el campo de hero.eyebrow es para todos los nichos (D-72):\n${linea}`);
  // Y el validador sigue avisando con más de cuatro palabras (H:src/lib/config-validator.ts:660–661).
  const mod = (await import(pathToFileURL(resolve(ROOT, VALIDADOR)).href)) as { validateVariantContracts: (c: unknown) => Issue[] };
  const avisos = (eyebrow: string) => mod.validateVariantContracts({ hero: { variant: "v6", eyebrow } }).filter((x) => x.severity === "warning" && x.path === "hero.eyebrow");
  assert.equal(avisos("una dos tres cuatro cinco").length, 1, "con cinco palabras avisa");
  assert.equal(avisos("una dos tres cuatro").length, 0, "con cuatro palabras no avisa");
});

test("`scripts/b4-tenant.ts show --id test-b4-peluqueria-a` (con Firestore, sólo lectura) devuelve un `config/{id}` cuyo `branding.colors` es igual al que `aplicarPaleta` construye desde la meta del fixture A y cuyo `hero.eyebrow` es el del fixture A", async () => {
  const m = await casilla("aplicarPaleta");
  const esperado = get(derivado(m, "a"), "branding.colors");
  assert.ok(existsSync(join(RAIZ_H, ".env.local")), `falta ${RAIZ_H}/.env.local: b4-tenant.ts show no puede leer Firestore (el test no se salta)`);
  const show = correrLargo(["--experimental-strip-types", TENANT, "show", "--id", ID_A], { cwd: RAIZ_H });
  assert.equal(show.status, 0, `b4-tenant.ts show --id ${ID_A} sale 0 (salió ${show.status})\n${show.out.slice(-3000)}`);
  const tenant = configDeShow(show.stdout);
  assert.deepEqual(get(tenant, "branding.colors"), esperado, `el branding.colors del tenant ${ID_A} = el que la casilla construye desde la meta del fixture A`);
  assert.equal(get(tenant, "hero.eyebrow"), get(fixture("a"), "hero.eyebrow"), `el hero.eyebrow del tenant ${ID_A} = el del fixture A`);
});
