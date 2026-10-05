// ALTA-IDIOMAS-01 · I1 (H) · las reseñas: la traducción marcada, sólo fuera de su idioma (D-237). Sesión A (2026-10-05): rojo.
//
// Liam (2026-10-05): una reseña la escribió una persona; Claude no la escribe ni la reescribe en su idioma ni toca el nombre de quien
// la escribió. En cada OTRO idioma escribe su traducción en `translations.<lang>.testimonials.<id>.text`, que la página ya marca
// «traducida del …» con «ver original» (D-130, TEAM-RESENAS-01: `originalText`, `originalLang`, `translated`). Es la única excepción a
// R24 —una reseña es la cita de un tercero—, escrita y acotada en `bloque-04/DISENO-REGLAS.md`. El idioma de origen es
// `testimonials[].lang` (D-182) o, sin él, el idioma base. La llamada de un idioma lleva el texto original de cada reseña que traduce:
// sin el original no hay traducción (es lo único que una llamada recibe escrito en otro idioma, y es de la autora, no de Claude).
import { test } from "node:test";
import assert from "node:assert/strict";
import { clienteFalso, cumplidor, existe, fixtureA, guardarEnFirestore, importarModulo, sinCapas, type Cfg, type Issue } from "./_comun.ts";

const MODULO = "src/lib/textos-claude.ts";

test("las reseñas: Claude no escribe una reseña en su propio idioma ni el nombre de quien la escribió; en cada otro idioma propone `testimonials.<id>.text`, la traducción que la página marca «traducida del …», con el original en el pedido; y `validarPropuesta` da error por una reseña en su idioma o por su nombre", async () => {
  assert.ok(existe(MODULO), `falta ${MODULO} (D-242)`);
  const m = await importarModulo(MODULO);
  const A = sinCapas(fixtureA());
  A.testimonials[1].lang = "en";
  const [a1, a2] = A.testimonials as Cfg[];
  const campos = (l: string) => (m.camposDeTexto(A, "peluqueria", l, "he") as { ruta: string }[]).map((c) => c.ruta);
  // (1) El catálogo: fuera de su idioma, sí; en su idioma y el nombre, nunca.
  assert.ok(campos("en").includes(`testimonials.${a1.id}.text`), "en: la reseña en hebreo se traduce");
  assert.ok(!campos("en").includes(`testimonials.${a2.id}.text`), "en: la reseña escrita en inglés no se toca");
  assert.ok(campos("ru").includes(`testimonials.${a2.id}.text`), "ru: la reseña escrita en inglés se traduce");
  assert.deepEqual(campos("he").filter((r) => r.startsWith("testimonials.")), [], "he: nada de reseñas en el idioma base (son de su autora)");
  for (const l of ["he", "en", "ru", "ar"]) assert.deepEqual(campos(l).filter((r) => /^testimonials\.[^.]+\.name$/.test(r)), [], `${l}: el nombre de quien la escribió no se traduce`);
  // (2) El pedido de un idioma lleva el original de cada reseña que traduce.
  const { cliente, pedidos } = clienteFalso(cumplidor);
  const { propuesta } = await m.escribirTextos(cliente, { config: A, niche: "peluqueria", base: "he" });
  const deRuso = pedidos.find((p) => p.rutas.includes(`testimonials.${a2.id}.text`));
  assert.ok(deRuso && deRuso.user.includes(a2.text), "la llamada que traduce una reseña lleva su texto original");
  assert.ok(typeof propuesta.ru?.[`testimonials.${a1.id}.text`] === "string", "ru: la propuesta trae la traducción");
  // (3) El validador.
  const mala = { he: { [`testimonials.${a1.id}.text`]: "otra cosa" }, en: { [`testimonials.${a2.id}.text`]: "Other words", [`testimonials.${a1.id}.name`]: "Yael B." }, ru: { [`testimonials.${a1.id}.text`]: "Стоит каждого шекеля." } };
  const caminos = (m.validarPropuesta(A, "peluqueria", "he", mala) as Issue[]).filter((e) => e.severity === "error").map((e) => e.path);
  for (const p of [`he:testimonials.${a1.id}.text`, `en:testimonials.${a2.id}.text`, `en:testimonials.${a1.id}.name`]) assert.ok(caminos.includes(p), `validarPropuesta da error en ${p} (hubo: ${caminos.join(", ")})`);
  assert.ok(!caminos.includes(`ru:testimonials.${a1.id}.text`), "la traducción a otro idioma no da error");
  // (4) Guardada: la traducción en su capa, la reseña de la raíz intacta.
  const doc = await guardarEnFirestore(A, m.cuerpoDePropuesta(A, "peluqueria", "he", mala, Object.entries(mala).flatMap(([l, t]) => Object.keys(t).map((r) => `${l}:${r}`))));
  assert.equal(doc.translations?.ru?.testimonials?.[a1.id]?.text, "Стоит каждого шекеля.", "la traducción llega a translations.ru.testimonials.<id>.text");
  assert.deepEqual(doc.testimonials, A.testimonials, "las reseñas de la raíz (texto, nombre, idioma) no cambian");
  assert.equal(doc.translations?.en?.testimonials, undefined, "lo que dio error no llega");
});
