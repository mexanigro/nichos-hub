// ALTA-IDIOMAS-01 · G1 (H) · nada se escribe solo (punto 5). Sesión A (2026-10-05): rojo.
//
// Hoy (medido por lectura, D-236) «Generar textos» funde lo que vuelve en el estado de la pestaña (`setContent(prev => ({ ...prev,
// ...generated }))`) y el dueño ve los campos ya cambiados, sin saber cuáles escribió Claude; con «Guardar» va todo. Ahora la ficha
// muestra la PROPUESTA por idioma y por campo —`PropuestaDeTextos`, un componente sin estado (se llama como función y se recorren sus
// elementos, como la casilla de variantes en tests/contacto-pie-casillas.test.ts)— con un control de aceptar por idioma·ruta,
// deshabilitado y con su mensaje donde hay error; y el guardado manda sólo lo aceptado con `cuerpoDePropuesta`, por el mismo PUT de
// siempre. Con la fusión de Firestore modelada (como tests/contenido-solo-cambios.test.ts, D-220): lo no aceptado no llega y lo que
// otra pestaña guardó entre la carga y el guardado queda como estaba.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existe, fixtureA, fuente, guardarEnFirestore, importarModulo, recorrer, sinCapas, type Cfg, type Issue } from "./_comun.ts";

const MODULO = "src/lib/textos-claude.ts";
const COMPONENTE = "src/components/propuesta-textos.tsx";
const PESTANA = "src/components/client-content-tab.tsx";

test("la pestaña Contenido muestra la propuesta por idioma y por campo y guarda sólo lo confirmado: `PropuestaDeTextos` pinta un control de aceptar por idioma·ruta, marcado si está aceptado y deshabilitado con su mensaje si tiene error; `cuerpoDePropuesta` manda sólo lo aceptado y, tras la fusión de Firestore, lo no aceptado no llega y lo que otra pestaña guardó entre la carga y el guardado queda como estaba; y la pestaña usa los dos y ya no funde la respuesta de Claude en sus campos", async () => {
  // (0) Hoy la pestaña funde lo que devuelve Claude en sus campos: aquí está el rojo.
  const pestana = fuente(PESTANA);
  assert.ok(!/\.\.\.generated\b/.test(pestana), `${PESTANA} todavía funde la respuesta de Claude en los campos (…generated): se guardaría sin confirmar`);
  assert.match(pestana, /\bPropuestaDeTextos\b/, `${PESTANA} muestra la propuesta con PropuestaDeTextos`);
  assert.match(pestana, /\bcuerpoDePropuesta\(/, `${PESTANA} guarda lo aceptado con cuerpoDePropuesta`);
  assert.ok(existe(COMPONENTE) && existe(MODULO), `faltan ${COMPONENTE} y ${MODULO} (D-242)`);
  const m = await importarModulo(MODULO);
  const { PropuestaDeTextos } = await importarModulo(COMPONENTE);
  const A = sinCapas(fixtureA());

  // (1) El componente: un control por idioma·ruta.
  const propuesta = { en: { "hero.eyebrow": "Colour studio", "services.cut.name": "uno dos tres cuatro cinco seis siete" }, ru: { "hero.subtitle": "Цвет без спешки" } };
  const errores = m.validarPropuesta(A, "peluqueria", "he", propuesta) as Issue[];
  const error = errores.find((e) => e.path === "en:services.cut.name" && e.severity === "error");
  assert.ok(error, "precondición: el nombre de 7 palabras da error");
  let recibido: string[] | undefined;
  const { elementos, textos } = recorrer(PropuestaDeTextos({ propuesta, errores, aceptados: ["en:hero.eyebrow"], onCambio: (a: string[]) => { recibido = a; } }));
  const control = (c: string) => elementos.find((e) => e.props?.["data-campo"] === c);
  for (const c of ["en:hero.eyebrow", "en:services.cut.name", "ru:hero.subtitle"]) assert.ok(control(c), `hay un control con data-campo="${c}"`);
  assert.equal(control("en:hero.eyebrow")!.props.checked, true, "lo aceptado está marcado");
  assert.ok(!control("en:hero.eyebrow")!.props.disabled, "lo aceptado sin error se puede desmarcar");
  assert.equal(control("en:services.cut.name")!.props.disabled, true, "lo que tiene error no se puede aceptar");
  assert.ok(textos.some((t) => t.includes(error!.message)), "el mensaje del error se ve junto al campo");
  for (const t of ["Colour studio", "Цвет без спешки"]) assert.ok(textos.some((x) => x.includes(t)), `se ve el texto propuesto «${t}»`);
  assert.ok(!control("ru:hero.subtitle")!.props.checked, "lo no aceptado no está marcado");
  control("ru:hero.subtitle")!.props.onChange?.({ target: { checked: true }, currentTarget: { checked: true } });
  assert.deepEqual([...(recibido ?? [])].sort(), ["en:hero.eyebrow", "ru:hero.subtitle"], "marcar un campo lo suma a los aceptados");

  // (2) El guardado: sólo lo aceptado, y lo que guardó otra pestaña se conserva.
  const cuerpo = m.cuerpoDePropuesta(A, "peluqueria", "he", propuesta, ["ru:hero.subtitle"]) as Cfg;
  assert.equal(JSON.stringify(cuerpo).includes("Colour studio"), false, "lo no aceptado no va en el cuerpo");
  const otra = await guardarEnFirestore(A, { brand: { tagline: "de otra pestaña" } });
  const doc = await guardarEnFirestore(otra, cuerpo);
  assert.equal(doc.translations?.ru?.hero?.subtitle, "Цвет без спешки", "lo aceptado llega a translations.ru");
  assert.equal(doc.translations?.en, undefined, "lo no aceptado no llega");
  assert.equal(doc.brand.tagline, "de otra pestaña", "lo que otra pestaña guardó entre la carga y el guardado queda como estaba");
  assert.deepEqual(m.cuerpoDePropuesta(A, "peluqueria", "he", propuesta, []), {}, "sin nada aceptado no se manda nada");
});
