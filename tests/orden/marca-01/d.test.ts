// MARCA-01 · D1, D2 (H) · la aprobación del material de una web (M1-6, D-289). Sesión A (2026-10-07): tests rojos — no existe
// `src/lib/material-cliente.ts`.
//
// La medición vive en T (`tools/gama.mjs`); el config, el Storage y los avisos, en H. La lógica recibe `bajar` y `medir` inyectados:
// aquí van dobles (inciso n) y W1 la corre con el `medir` real de T. Los dobles de Firestore y Storage son los de PLANTILLA-01, con
// tokens coherentes (el token es el sha256 del contenido, D-22). Caja negra: `import()` dinámico de los módulos de H.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { CLIENTE, PALETA_YULIA, RUTA, ROOT, correr, deStorage, existe, hojas, importarModulo, mundo, porJson, urlDe, type Cfg } from "./_comun.ts";

const MODULO = "src/lib/material-cliente.ts";
const P = (path: string) => `clients/${CLIENTE}/media/${path}`;
type Hueco = { ruta: string; url: string; veredicto: "PASA" | "NO"; motivos: string[] };
type Fila = Cfg & { role: string; src: string };

/** Un config con material en cada hueco (19 urls) y, aparte, los bytes de cada url. */
function clienteConMaterial() {
  const bytes = new Map<string, Buffer>();
  const u = (path: string, contenido = `bytes de ${path}`) => { const b = Buffer.from(contenido); const url = urlDe(P(path), b); bytes.set(url, b); return url; };
  const config: Cfg = {
    branding: { mode: "light", colors: PALETA_YULIA, texture: u("branding/textura.jpg", "la textura de A"), localPhoto: u("branding/local.jpg"), localPhotoMobile: u("branding/local-v.jpg") },
    brand: { name: "סלון", logo: u("branding/logo.png"), logoDark: u("branding/logo-dark.png"), ogImage: u("branding/og.jpg") },
    hero: { video: {
      mp4: u("hero/hero.mp4"), webm: u("hero/hero.webm"), poster: u("hero/hero-poster.avif"),
      medium: { mp4: u("hero/hero-1280.mp4"), webm: u("hero/hero-1280.webm") },
      portrait: { mp4: u("hero/hero-v.mp4"), webm: u("hero/hero-v.webm"), poster: u("hero/hero-v-poster.avif") },
    } },
    services: [{ id: "a", name: "א" }, { id: "b", name: "ב" }, { id: "c", name: "ג" }],
    sections: {
      services: { images: [u("services/servicio-1.jpg"), "", u("services/servicio-3.jpg")] },
      gallery: { items: [{ id: "g1", type: "color", src: u("gallery/galeria-1.jpg"), alt: "" }] },
      instagram: { images: [u("images/ig-1.jpg")] },
    },
    staff: [{ id: "noa", name: "נועה", photoUrl: u("staff/retrato-1.jpg") }],
  };
  config.gallery = [config.sections.gallery.items[0].src];
  // La plantilla A tiene un archivo con los mismos bytes que la textura de la clienta (lo que copia desde-plantilla).
  const plantillaA = { branding: { texture: urlDe("clients/test-b4-peluqueria-a/media/branding/textura.jpg", Buffer.from("la textura de A")) } };
  return { config, bytes, plantillas: { a: plantillaA, c: { branding: {} } } };
}
const RUTAS = [
  "hero.video.mp4", "hero.video.webm", "hero.video.poster", "hero.video.medium.mp4", "hero.video.medium.webm", "hero.video.portrait.mp4",
  "hero.video.portrait.webm", "hero.video.portrait.poster", "branding.texture", "branding.localPhoto", "branding.localPhotoMobile",
  "sections.services.images.0", "sections.services.images.2", "sections.gallery.items.0.src", "sections.instagram.images.0",
  "staff.0.photoUrl", "brand.logo", "brand.logoDark", "brand.ogImage",
].sort();

test("src/lib/material-cliente.ts exporta aprobarMaterial({ config, plantillas, excepciones }, { bajar, medir }), que baja de Storage cada hueco con material del config —los 8 archivos del vídeo, la textura, el local y el local vertical, cada foto de servicio, cada pieza de galería, cada foto de Instagram, cada retrato, la imagen del link y los dos logos— y mide en una sola llamada a medir, con los gates de M1-3, los dos clips webm (v), la textura (quietud), el local y el local vertical (excepción «su salón»), las fotos de servicio y de galería (en serie y sin fondo) y los retratos (en serie, excepción «su retrato»); los pósteres, los mp4, Instagram, la imagen del link y los logos sólo se bajan; dice de cada hueco PASA o NO con sus motivos —«no se puede bajar (<estado>)», «material de la plantilla A» o «C» cuando lo bajado es un archivo de esa plantilla, o cada medida que falla con su número—; la excepción que se le da a un hueco llega a medir como excepcion; borra lo que bajó; y pasa es verdadero sólo con todos en PASA", async () => {
  // (1) El módulo. Hoy no existe: aquí está el rojo.
  assert.ok(existe(MODULO), `falta ${MODULO} (M1-6): hoy no hay cómo decir, hueco por hueco, si el material de una web está en su paleta`);
  const { aprobarMaterial } = await importarModulo(MODULO);
  assert.equal(typeof aprobarMaterial, "function", `${MODULO} exporta aprobarMaterial`);

  const { config, bytes, plantillas } = clienteConMaterial();
  const ig = config.sections.instagram.images[0], serv3 = config.sections.services.images[2], clip = config.hero.video.webm;
  const bajadas: string[] = [], llamadas: { files: Fila[]; colors: Cfg; contenidos: Map<string, Buffer> }[] = [];
  const bajar = async (url: string) => { bajadas.push(url); return url === ig ? { status: 403 } : { status: 200, bytes: Buffer.from(bytes.get(url)!) }; };
  const medir = async (files: Fila[], colors: Cfg) => {
    llamadas.push({ files: porJson(files), colors, contenidos: new Map(files.map((f) => [f.role, readFileSync(f.src)])) });
    return { rows: files.map((f) => f.role === "servicio 3" ? { ...f, T: true, K: true, S: true, N: false, dN: 0.0233, Hn: 272, pasa: false } : { ...f, T: f.excepcion ? null : true, K: true, N: true, dN: 0.01, pasa: true }) };
  };
  const r = (await aprobarMaterial({ config, plantillas, excepciones: { "sections.services.images.2": "trabajo real" } }, { bajar, medir })) as { huecos: Hueco[]; pasa: boolean };

  // (2) Cada hueco con material, bajado una vez.
  assert.deepEqual(r.huecos.map((h) => h.ruta).sort(), RUTAS, "un resultado por hueco con material (19), sin gallery[] (el respaldo de la galería) ni los vacíos");
  assert.deepEqual([...new Set(bajadas)].sort(), RUTAS.map((x) => hojas(config).find(([k]) => k === x)![1] as string).sort(), "cada hueco se baja de su url");

  // (3) Una sola llamada a medir, con la paleta y los gates de M1-3.
  assert.equal(llamadas.length, 1, "una sola llamada a medir (E compara cada clip con el local de la misma llamada)");
  const [{ files, colors, contenidos }] = llamadas;
  assert.deepEqual(colors, PALETA_YULIA, "medir recibe branding.colors");
  const por = (role: string) => { const f = files.find((x) => x.role === role); assert.ok(f, `medir recibe «${role}» (recibe: ${files.map((x) => x.role).join(", ")})`); return f; };
  assert.deepEqual(files.map((f) => f.role).sort(), ["clip 16:9", "clip 9:16", "galería 1", "local 16:9", "local 9:16", "retrato 1", "servicio 1", "servicio 3", "textura"].sort(), "se miden los dos clips webm, la textura, los dos locales, servicios, galería y retratos; nada más");
  assert.equal(por("clip 16:9").kind, "video"); assert.equal(por("clip 16:9").v, true);
  assert.equal(por("clip 9:16").kind, "video"); assert.equal(por("clip 9:16").v, true);
  assert.deepEqual(contenidos.get("clip 16:9"), bytes.get(clip), "el clip 16:9 que se mide es hero.video.webm, bajado a un archivo local");
  assert.deepEqual(contenidos.get("clip 9:16"), bytes.get(config.hero.video.portrait.webm), "el 9:16 es hero.video.portrait.webm");
  assert.equal(por("textura").quietud, true, "la textura se mide con quietud (Q)");
  for (const l of ["local 16:9", "local 9:16"]) assert.equal(por(l).excepcion, "su salón", `${l}: T es dato (M1-3)`);
  assert.equal(por("servicio 1").serie, "servicio"); assert.equal(por("galería 1").serie, "galería");
  assert.equal(por("retrato 1").serie, "retrato"); assert.equal(por("retrato 1").excepcion, "su retrato", "retrato: T es dato (M1-3)");
  assert.equal(por("servicio 3").excepcion, "trabajo real", "la excepción que se le da a un hueco llega a medir");
  assert.equal(por("servicio 1").excepcion, undefined, "y no a los demás");
  assert.deepEqual(files.filter((f) => f.fondo).map((f) => f.role), [], "ningún archivo se mide con F (R24: «F no aplica»)");

  // (4) Los veredictos y sus motivos.
  const h = (ruta: string) => r.huecos.find((x) => x.ruta === ruta)!;
  assert.equal(h("sections.instagram.images.0").veredicto, "NO", "una foto de Instagram que Storage no sirve (403) no pasa");
  assert.ok(h("sections.instagram.images.0").motivos.some((m) => m.includes("no se puede bajar (403)")), `Instagram con un token viejo: «no se puede bajar (403)» (${h("sections.instagram.images.0").motivos})`);
  assert.equal(h("branding.texture").veredicto, "NO", "la textura con los bytes de un archivo de la plantilla A no pasa: es material de la plantilla");
  assert.ok(h("branding.texture").motivos.some((m) => m.includes("material de la plantilla A")), `la textura con los bytes de la plantilla A: «material de la plantilla A» (${h("branding.texture").motivos})`);
  assert.equal(h("sections.services.images.2").veredicto, "NO", "el servicio 3, con N falso, no pasa");
  assert.ok(h("sections.services.images.2").motivos.some((m) => /^N\b/.test(m) && /0[.,]0233/.test(m)), `el servicio 3 dice que falla N, con su dN (${h("sections.services.images.2").motivos})`);
  const otros = r.huecos.filter((x) => !["sections.instagram.images.0", "branding.texture", "sections.services.images.2"].includes(x.ruta));
  assert.deepEqual(otros.filter((x) => x.veredicto !== "PASA").map((x) => `${x.ruta}: ${x.motivos}`), [], "los demás PASA");
  assert.equal(r.pasa, false, "con un hueco en NO, pasa es falso");
  for (const f of files) assert.ok(!existsSync(f.src), `borra lo que bajó (${f.src})`);

  // (5) Con todo bien, pasa.
  const bien = (await aprobarMaterial({ config, plantillas: { a: { branding: {} }, c: { branding: {} } }, excepciones: {} }, {
    bajar: async (url: string) => ({ status: 200, bytes: Buffer.from(bytes.get(url)!) }),
    medir: async (fs: Fila[]) => ({ rows: fs.map((f) => ({ ...f, T: true, K: true, N: true, pasa: true })) }),
  })) as { huecos: Hueco[]; pasa: boolean };
  assert.equal(bien.pasa, true, "con todos en PASA, pasa es verdadero");
  assert.ok(bien.huecos.every((x) => x.veredicto === "PASA"));
});

test("avisosDeMaterial(resultado) da un aviso de la sección «material» por cada hueco que no pasa, con su ruta y su motivo, y ninguno cuando todo pasa; desdePlantilla y la consola de textos —exportarTextos y aplicarTextos— suman a sus avisos, sin medir, un aviso «material de la plantilla» por cada hueco cuyo token es el de una url de la plantilla A o C; y node scripts/material.ts sin argumentos sale 2 con el uso de sus tres comandos (pedidos, subir y aprobar), y su aprobar mide con el medir de tools/gama.mjs del hermano T", async () => {
  assert.ok(existe(MODULO), `falta ${MODULO} (M1-6)`);
  const { avisosDeMaterial, medirConGama } = await importarModulo(MODULO);
  assert.equal(typeof avisosDeMaterial, "function", `${MODULO} exporta avisosDeMaterial`);

  // (1) Los avisos de un resultado.
  const resultado = { pasa: false, huecos: [
    { ruta: "branding.texture", url: "u1", veredicto: "NO", motivos: ["material de la plantilla A"] },
    { ruta: "sections.services.images.2", url: "u2", veredicto: "NO", motivos: ["N: dN 0,0233 · tono 272°"] },
    { ruta: "brand.logo", url: "u3", veredicto: "PASA", motivos: [] },
  ] };
  const avisos = avisosDeMaterial(resultado) as { seccion: string; message: string }[];
  assert.equal(avisos.length, 2, "un aviso por hueco que no pasa");
  assert.ok(avisos.every((a) => a.seccion === "material"), "de la sección «material»");
  assert.ok(avisos[0].message.includes("branding.texture") && avisos[0].message.includes("material de la plantilla A"), `con su ruta y su motivo (${avisos[0].message})`);
  assert.ok(avisos[1].message.includes("sections.services.images.2") && avisos[1].message.includes("0,0233"), `con su ruta y su motivo (${avisos[1].message})`);
  assert.deepEqual(avisosDeMaterial({ pasa: true, huecos: [resultado.huecos[2]] }), [], "ninguno cuando todo pasa");

  // (2) desde-plantilla y la consola de textos: «material de la plantilla», sin medir (por el token).
  const { desdePlantilla } = await importarModulo("src/lib/desde-plantilla.ts");
  const { exportarTextos, aplicarTextos } = await importarModulo("src/lib/textos-consola.ts");
  const m = await mundo();
  const limpio = (await exportarTextos({ clientId: CLIENTE }, { db: m.db })) as { avisos: { seccion: string }[] };
  assert.deepEqual(limpio.avisos.filter((a) => a.seccion === "material"), [], "un cliente recién dado de alta (sin material) no tiene avisos de material");
  const dp = (await desdePlantilla({ clientId: CLIENTE, plantilla: "a", aplicar: true }, { db: m.db, bucket: m.bucket })) as { avisos: { seccion: string; message: string }[] };
  const tokensA = new Set(hojas(m.tenants.a).map(([, v]) => deStorage(v)?.token).filter(Boolean));
  const deA = hojas(m.doc("config", CLIENTE)).filter(([k, v]) => !k.startsWith("gallery.") && tokensA.has(deStorage(v)?.token)).map(([k]) => k);
  assert.ok(deA.length > 20, `precondición: desde-plantilla copió el material de A (${deA.length} huecos con un token de A)`);
  for (const [donde, lista] of [["desdePlantilla", dp.avisos], ["exportarTextos", ((await exportarTextos({ clientId: CLIENTE }, { db: m.db })) as { avisos: { seccion: string; message: string }[] }).avisos], ["aplicarTextos", ((await aplicarTextos({ clientId: CLIENTE, propuesta: {} }, { db: m.db })) as { avisos: { seccion: string; message: string }[] }).avisos]] as [string, { seccion: string; message: string }[]][]) {
    const mat = lista.filter((a) => a.seccion === "material");
    assert.ok(mat.every((a) => a.message.includes("material de la plantilla")), `${donde}: los avisos de material dicen «material de la plantilla»`);
    const faltan = deA.filter((k) => !mat.some((a) => a.message.includes(k)));
    assert.deepEqual(faltan, [], `${donde}: un aviso «material de la plantilla» por cada hueco con un token de A (${mat.length} avisos, ${deA.length} huecos)`);
  }

  // (3) La consola.
  const r = correr(["--experimental-strip-types", "scripts/material.ts"], { cwd: ROOT });
  assert.equal(r.status, 2, `node scripts/material.ts sin argumentos sale 2 (sale ${r.status}): ${r.out.slice(-600)}`);
  for (const c of ["pedidos", "subir", "aprobar"]) assert.ok(r.out.includes(c), `el uso nombra el comando «${c}»`);
  assert.ok(/medirConGama/.test(readFileSync(`${ROOT}/scripts/material.ts`, "utf8")), "scripts/material.ts aprobar mide con medirConGama (el medir de T)");
  assert.equal(typeof medirConGama, "function", `${MODULO} exporta medirConGama(raizT)`);
  const medirT = await medirConGama(RUTA.T);
  assert.equal(typeof medirT, "function", "medirConGama(raizT) devuelve el medir de tools/gama.mjs del hermano T");
});
