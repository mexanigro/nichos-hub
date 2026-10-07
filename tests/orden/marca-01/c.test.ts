// MARCA-01 · C1 (H) · el pedido de ChatGPT parametrizado (M1-5, D-288). Sesión A (2026-10-07): test rojo — no existe
// `src/lib/pedidos-chatgpt.ts`.
//
// Hoy el bloque de color de cada pedido se escribe a mano por paleta (`PROMPTS-CONTENIDO.md`); el de Yulia (`pedidos-yulia.md`) lo
// armó la sesión de diseño con la regla de M1-5. Lo que se mide aquí sale de esa regla: la luz por el signo de b de accentStrong y
// los prohibidos por el rango de cada sector (D-285 (5)). Caja negra: `import()` dinámico del módulo. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { PALETA_YULIA, existe, importarModulo, porJson, type Cfg } from "./_comun.ts";

const MODULO = "src/lib/pedidos-chatgpt.ts";
const URL = (n: string) => `https://firebasestorage.googleapis.com/v0/b/x/o/clients%2Fdemo-x%2Fmedia%2Fservices%2F${n}?alt=media&token=0123456789abcdef0123456789abcdef`;
const SALON = "a long bright salon with white walls, black wall sconces, wooden counters with a crimson front and black styling chairs";
const CALIDA = "warm-neutral, about 4000-4500 K, no blue or green cast";
const FRIA = "cool-neutral, about 6000 K, no orange cast";

/** Un config de peluquería con tres servicios (nombre y descripción en inglés en la capa), dos piezas de galería, una persona, el local y el logo. */
function config(colores: Record<string, string>, modo: "light" | "dark" = "light"): Cfg {
  return porJson({
    language: "he",
    branding: { mode: modo, colors: colores, localPhoto: URL("local.jpg") },
    brand: { name: "סלון", logo: URL("logo.png") },
    services: [{ id: "corte", name: "תספורת" }, { id: "color", name: "צבע" }, { id: "rizos", name: "תלתלים" }],
    sections: {
      services: { images: [URL("servicio-1.jpg"), URL("servicio-2.jpg"), URL("servicio-3.jpg")] },
      gallery: { items: [{ id: "g1", type: "color", src: URL("galeria-1.jpg"), alt: "צבע" }, { id: "g2", type: "rizos", src: URL("galeria-2.jpg"), alt: "תלתלים" }] },
    },
    staff: [{ id: "noa", name: "נועה", specialty: "צבע", photoUrl: URL("retrato-1.jpg") }],
    translations: { en: { services: {
      corte: { name: "Precision haircut", description: "A clean precision cut shaped to the face" },
      color: { name: "Full colour", description: "One even colour from roots to ends" },
      rizos: { name: "Curl care", description: "Defined soft curls without frizz" },
    } } },
  });
}
const prohibidos = (pedido: string) => {
  const m = pedido.match(/^- forbidden colors: (.*?); no neon, no colored gels/m);
  return m ? m[1].split(/,\s*/).map((s) => s.trim()).sort() : null;
};

test("src/lib/pedidos-chatgpt.ts exporta pedidosDeMaterial(config, salon), que da un pedido por hueco —cada foto de servicio (sections.services.images.<i>) con el nombre del servicio en inglés, cada pieza de la galería (sections.gallery.items.<i>.src) con su tipo, cada persona del equipo (staff.<i>.photoUrl), el local (branding.localPhoto) y el logo (brand.logo)—, cada uno con el bloque común armado de branding.colors y branding.mode: surface, surfaceAlt, accent, accentStrong y scrim en hex; la luz por el signo de b de accentStrong en OKLab, «warm-neutral, about 4000-4500 K, no blue or green cast» con b > 0 y «cool-neutral, about 6000 K, no orange cast» con b < 0; «high-key» en modo claro y «low-key» en oscuro; prohibidos los sectores de tono cuyo rango entero queda a más de 35° de H(accentStrong), más «no neon, no colored gels»; la descripción del salón como escena; una persona distinta en cada foto de servicio y de galería; con la paleta de Yulia, prohibidos exactamente yellow, green, sage, olive, teal, blue y violet; y el mismo texto para la misma entrada", async () => {
  // (1) El módulo. Hoy no existe: aquí está el rojo.
  assert.ok(existe(MODULO), `falta ${MODULO} (M1-5): hoy el bloque de color de cada pedido se escribe a mano por paleta`);
  const { pedidosDeMaterial } = await importarModulo(MODULO);
  assert.equal(typeof pedidosDeMaterial, "function", `${MODULO} exporta pedidosDeMaterial`);
  type Pedido = { ruta: string; hueco: string; pedido: string };
  const pedidos = (c: Cfg) => pedidosDeMaterial(c, SALON) as Pedido[];

  // (2) Un pedido por hueco, con su ruta y su tipo.
  const yulia = pedidos(config(PALETA_YULIA));
  assert.deepEqual(yulia.map((p) => [p.ruta, p.hueco]), [
    ["sections.services.images.0", "servicio"], ["sections.services.images.1", "servicio"], ["sections.services.images.2", "servicio"],
    ["sections.gallery.items.0.src", "galeria"], ["sections.gallery.items.1.src", "galeria"],
    ["staff.0.photoUrl", "retrato"], ["branding.localPhoto", "local"], ["brand.logo", "logo"],
  ], "un pedido por hueco: servicios, galería, retratos, local y logo, en ese orden");

  // (3) El bloque común en cada uno: los hex, la luz, la clave, los prohibidos y el salón.
  for (const p of yulia) {
    for (const k of ["surface", "surfaceAlt", "accent", "accentStrong", "scrim"]) assert.ok(p.pedido.toLowerCase().includes(PALETA_YULIA[k].toLowerCase()), `${p.ruta}: el pedido nombra ${k} ${PALETA_YULIA[k]}`);
    assert.ok(p.pedido.includes(CALIDA), `${p.ruta}: accentStrong ${PALETA_YULIA.accentStrong} tiene b > 0, luz «${CALIDA}»`);
    assert.ok(!p.pedido.includes(FRIA), `${p.ruta}: y no la fría`);
    assert.ok(p.pedido.includes("high-key"), `${p.ruta}: modo claro, «high-key»`);
    assert.deepEqual(prohibidos(p.pedido), ["blue", "green", "olive", "sage", "teal", "violet", "yellow"], `${p.ruta}: con la paleta de Yulia (H 25°), prohibidos exactamente yellow, green, sage, olive, teal, blue y violet (una línea «- forbidden colors: …; no neon, no colored gels»)`);
    assert.ok(p.pedido.includes(SALON), `${p.ruta}: la descripción del salón va como escena`);
  }
  // (4) Lo propio de cada hueco.
  for (const [i, en] of ["Precision haircut", "Full colour", "Curl care"].entries()) assert.ok(yulia[i].pedido.includes(en), `servicio ${i + 1}: el pedido nombra el servicio en inglés («${en}»)`);
  assert.ok(yulia[3].pedido.includes("color") && yulia[4].pedido.includes("rizos"), "cada pieza de galería lleva su tipo");
  const personas = yulia.filter((p) => p.hueco === "servicio" || p.hueco === "galeria").map((p) => p.pedido.match(/^PERSON:.*$/m)?.[0]);
  assert.ok(personas.every(Boolean), "cada foto de servicio y de galería lleva su persona en una línea «PERSON: …»");
  assert.equal(new Set(personas).size, personas.length, `una persona distinta en cada foto (R17): ${personas.join(" | ")}`);

  // (5) Determinista.
  assert.deepEqual(pedidos(config(PALETA_YULIA)), yulia, "la misma entrada da el mismo texto");

  // (6) Un acento frío (b < 0) en modo oscuro: luz fría, «low-key» y otros prohibidos.
  const fria = pedidos(config({ ...PALETA_YULIA, accentStrong: "#2f4f7f", accent: "#3d5e8f" }, "dark"));
  for (const p of fria) {
    assert.ok(p.pedido.includes(FRIA) && !p.pedido.includes(CALIDA), `${p.ruta}: accentStrong #2f4f7f tiene b < 0, luz «${FRIA}»`);
    assert.ok(p.pedido.includes("low-key") && !p.pedido.includes("high-key"), `${p.ruta}: modo oscuro, «low-key»`);
    assert.deepEqual(prohibidos(p.pedido), ["green", "magenta", "olive", "orange", "red", "sage", "teal", "yellow"], `${p.ruta}: con H 258°, prohibidos red, orange, yellow, green, sage, olive, teal y magenta`);
  }
});
