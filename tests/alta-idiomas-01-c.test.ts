// ALTA-IDIOMAS-01 · copia promovida (PLANTILLA-01, 2026-10-05, D-260) de tests/orden/alta-idiomas-01/c.test.ts. La orden quedó
// aprobada por Liam el 2026-10-05 (T 3222922 · H 5502f02) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte: entera (ninguna de sus afirmaciones sale a la red: el cliente de Anthropic es falso y la fusión de Firestore se modela).
// ALTA-IDIOMAS-01 · C1 (H) · nada de hechos inventados: lo que el código puede vigilar (punto 3). Sesión A (2026-10-05): rojo.
//
// Medido por A (D-243) sobre el fixture A en los cuatro idiomas (93–94 textos por idioma): los hechos con cifra —«14 שנים» de la bio
// de Noa, «עד גיל 12», «4–6 חודשים», «24 שעות»— aparecen con la MISMA cifra en he, en, ru y ar, y todas están en lo que la clienta dio.
// Eso se puede vigilar: un número de un texto propuesto que no está en sus textos (en cualquier idioma), en sus notas ni en sus datos
// (precios, duraciones, horarios; sin las urls de Storage, cuyo token trae dígitos al azar) es un hecho que no dio. Los dígitos
// árabe-índicos (٠–٩) y los persas (۰–۹) cuentan como los occidentales. Lo que NO se puede vigilar por código, y queda declarado en la
// hoja: el número escrito en palabras (medido: «עד שעתיים», «حتى ساعتين» = «hasta dos horas»), premios, certificaciones, marcas de
// producto y promesas de resultado dichos sin cifra. Esos los guardan el pedido a Claude y la confirmación del dueño (punto 5).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existe, fixtureA, importarModulo, sinCapas, type Cfg, type Issue } from "./orden/alta-idiomas-01/_comun.ts";

const MODULO = "src/lib/textos-claude.ts";
/** Los números que dio la clienta, contados como en la hoja (para la precondición del arnés). */
function numerosDados(c: Cfg): Set<string> {
  const out = new Set<string>();
  const ver = (v: unknown) => {
    if (typeof v === "number") for (const n of String(v).match(/\d+/g) ?? []) out.add(n);
    else if (typeof v === "string") { if (!/^https?:/.test(v)) for (const n of v.match(/\d+/g) ?? []) out.add(n); }
    else if (v && typeof v === "object") Object.values(v).forEach(ver);
  };
  ver(c);
  return out;
}

test("`validarPropuesta` da error por cada número de un texto propuesto que no está en lo que dio la clienta —sus textos en cualquier idioma, sus notas y sus datos—, con los dígitos árabe-índicos contados como los occidentales; y los números que sí dio pasan, en cualquier idioma", async () => {
  assert.ok(existe(MODULO), `falta ${MODULO} (D-242): hoy nada mira los números de lo que escribe Claude`);
  const m = await importarModulo(MODULO);
  const A = sinCapas(fixtureA());
  // Precondición del arnés: 25 y 2019 no están en lo que dio la clienta; 14 sí (la bio de Noa).
  const dados = numerosDados(fixtureA());
  assert.ok(!dados.has("25") && !dados.has("2019") && dados.has("14"), "precondición: 25 y 2019 no están en el fixture A y 14 sí");

  const propuesta = {
    en: { "hero.subtitle": "More than 25 years of colour", "staff.noa.bio": "Studio owner. 14 years in colour.", "brand.description": "Open since 2019 by the sea" },
    ar: { "hero.subtitle": "أكثر من ٢٥ عامًا من الخبرة", "staff.noa.bio": "صاحبة الاستوديو. ١٤ عامًا في الصبغ." },
  };
  const errores = (notas?: string) => (m.validarPropuesta(A, "peluqueria", "he", propuesta, notas) as Issue[]).filter((e) => e.severity === "error");
  const sin = errores();
  const camino = (p: string) => sin.find((e) => e.path === p);
  // (1) Un número inventado: error, en cualquier sistema de dígitos, y el mensaje lo nombra.
  for (const p of ["en:hero.subtitle", "ar:hero.subtitle", "en:brand.description"]) assert.ok(camino(p), `validarPropuesta da error en ${p} (número que la clienta no dio; hubo: ${sin.map((e) => e.path).join(", ")})`);
  assert.match(camino("en:hero.subtitle")!.message, /25/, "el mensaje nombra el número");
  assert.match(camino("ar:hero.subtitle")!.message, /25|٢٥/, "el mensaje nombra el número (dígitos árabe-índicos)");
  // (2) Un número dado: sin error, también escrito con dígitos árabe-índicos.
  for (const p of ["en:staff.noa.bio", "ar:staff.noa.bio"]) assert.ok(!camino(p), `${p} lleva 14, que la clienta dio: sin error`);
  // (3) Lo que dice en sus notas también es lo que dio.
  assert.ok(!errores("Abrimos en 2019.").find((e) => e.path === "en:brand.description"), "2019 dicho en las notas: sin error");
});
