// CONEXION-01 · A (H) · la puerta del hub: src/lib/media-upload.ts (subirMaterial + resolveContentType), POST /api/upload/[clientId] con
// vídeo y `rol`, y scripts/b4-material.ts que sube el material de un fixture a Storage y reescribe el fixture. Sesión A (2026-09-21):
// tests rojos (hoy no existen media-upload.ts ni b4-material.ts; la ruta acepta sólo imágenes ≤ 5 MB, nombra por timestamp y el token es
// aleatorio). Caja negra: `subirMaterial` y `resolveContentType` se importan en proceso aparte (`nodeE`, cwd = H) con un bucket EN MEMORIA
// que registra save/setMetadata; el script por spawnSync sobre un fixture mínimo y una carpeta --media temporales, con --bucket-falso.
// Ningún test toca Storage ni Firestore: bucket en memoria, --bucket-falso y FIREBASE_* en blanco en cada hijo (un intento real falla
// en getDb() antes de salir a la red). Interfaz que fijan estos tests: media-upload.ts se importa con node --experimental-strip-types
// (imports relativos con extensión, como scripts/b4-tenant.ts; sin alias @/); `--media <dir>` sustituye `T/dev-fixtures/media`
// (`/dev-fixtures/media/paleta-<p>/<nombre>` → `<dir>/paleta-<p>/<nombre>`); «subidos N · iguales M» cuentan archivos distintos y
// «reescritos K» apariciones en el fixture.
// VERDAD-06 D2 (2026-09-21): copia editable promovida a npm test (la orden está aprobada y retirada de rojo-verde --todas; el original
// en tests/orden/conexion-01/ queda congelado).
import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, SIN_FIREBASE, conTemporalAsync, correrLargo, cuenta, nodeE, tokenDe, ultimoJson, urlStorage } from "./orden/conexion-01/_util.ts";

const MEDIA_UPLOAD = "src/lib/media-upload.ts";
const RUTA = "src/app/api/upload/[clientId]/route.ts";
const SCRIPT = "scripts/b4-material.ts";
const URL_MEDIA = JSON.stringify(pathToFileURL(resolve(ROOT, MEDIA_UPLOAD)).href);
const MB = 1024 * 1024;
const ID = "test-b4-peluqueria-x";
type Subida = { url: string; path: string; bytes: number };
type Intento = { ok?: Subida; error?: string };
type Evento = { op: "save" | "setMetadata"; path: string; bytes?: number; metadata: Record<string, unknown> | null };
type SalidaA1 = { hero: Intento; heroOtraVez: Intento; heroDistinto: Intento; saneado: Intento; tipos: Record<string, Intento>; imagenTope: Intento; imagenExceso: Intento; videoTope: Intento; videoExceso: Intento; texto: Intento; eventos: Evento[] };

test("src/lib/media-upload.ts exporta subirMaterial({ clientId, rol, nombre, buffer, contentType }, deps?) que guarda en Storage en `clients/<clientId>/media/<rol>/<nombre saneado>` con `cacheControl: public, max-age=31536000` y un token de descarga igual a los 32 primeros hex del sha256 del contenido, y devuelve { url, path, bytes } con url `https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path codificado>?alt=media&token=<token>`; admite image/jpeg, image/png, image/webp, image/avif (≤ 5 MB) y video/mp4, video/webm (≤ 6 MB); otro tipo o un exceso lanza un error que nombra el archivo y el límite; el mismo contenido en el mismo `rol/nombre` produce la misma url (idempotente) y un contenido distinto produce otra; `deps.bucket` sustituye el bucket real sólo para pruebas (los tests nunca escriben en Storage)", () => {
  // Bucket en memoria con la forma mínima de @google-cloud/storage: file(path) → { save, setMetadata, exists }; registra cada llamada.
  const r = nodeE(`import { subirMaterial } from ${URL_MEDIA};
const eventos = []; const archivos = new Map();
const bucket = { name: "falso", file(path) { return {
  async save(buffer, opts) { eventos.push({ op: "save", path, bytes: buffer.length, metadata: (opts && opts.metadata) || null }); archivos.set(path, Buffer.from(buffer)); },
  async setMetadata(m) { eventos.push({ op: "setMetadata", path, metadata: m || null }); },
  async exists() { return [archivos.has(path)]; },
}; } };
const deps = { bucket };
const intento = async (e) => { try { return { ok: await subirMaterial(e, deps) }; } catch (err) { return { error: String((err && err.message) || err) }; } };
const id = ${JSON.stringify(ID)};
const mp4 = Buffer.from("mp4 de prueba");
const out = {};
out.hero = await intento({ clientId: id, rol: "hero", nombre: "hero.mp4", buffer: mp4, contentType: "video/mp4" });
out.heroOtraVez = await intento({ clientId: id, rol: "hero", nombre: "hero.mp4", buffer: Buffer.from(mp4), contentType: "video/mp4" });
out.heroDistinto = await intento({ clientId: id, rol: "hero", nombre: "hero.mp4", buffer: Buffer.from("otro contenido"), contentType: "video/mp4" });
out.saneado = await intento({ clientId: id, rol: "gallery", nombre: "Mi Foto (1) ñ.JPG", buffer: Buffer.from("jpg"), contentType: "image/jpeg" });
out.tipos = {};
for (const [tipo, ext] of [["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"], ["video/mp4", "mp4"], ["video/webm", "webm"]]) out.tipos[tipo] = await intento({ clientId: id, rol: "services", nombre: "t." + ext, buffer: Buffer.from("x " + tipo), contentType: tipo });
out.imagenTope = await intento({ clientId: id, rol: "services", nombre: "tope.png", buffer: Buffer.alloc(5 * 1048576, 1), contentType: "image/png" });
out.imagenExceso = await intento({ clientId: id, rol: "services", nombre: "grande.png", buffer: Buffer.alloc(5 * 1048576 + 1, 1), contentType: "image/png" });
out.videoTope = await intento({ clientId: id, rol: "hero", nombre: "tope.webm", buffer: Buffer.alloc(6 * 1048576, 2), contentType: "video/webm" });
out.videoExceso = await intento({ clientId: id, rol: "hero", nombre: "grande.webm", buffer: Buffer.alloc(6 * 1048576 + 1, 2), contentType: "video/webm" });
out.texto = await intento({ clientId: id, rol: "services", nombre: "notas.txt", buffer: Buffer.from("hola"), contentType: "text/plain" });
out.eventos = eventos;
console.log(JSON.stringify(out));`, { env: SIN_FIREBASE });
  assert.equal(r.status, 0, `subirMaterial debe importarse de ${MEDIA_UPLOAD} y correr con un bucket en memoria (exit ${r.status})\n${r.out.slice(-2000)}`);
  const o = ultimoJson(r) as SalidaA1;
  const mp4 = Buffer.from("mp4 de prueba");
  const path = `clients/${ID}/media/hero/hero.mp4`;
  const token = tokenDe(mp4);
  // Path reproducible (sin timestamp), bytes, token = sha256[0..32) y la url exacta con el bucket de deps.
  assert.ok(o.hero.ok, `hero.mp4 debe subirse: ${o.hero.error}`);
  assert.deepEqual(Object.keys(o.hero.ok).sort(), ["bytes", "path", "url"], "devuelve { url, path, bytes }");
  assert.equal(o.hero.ok.path, path, "path = clients/<clientId>/media/<rol>/<nombre>");
  assert.equal(o.hero.ok.bytes, mp4.length);
  assert.equal(o.hero.ok.url, urlStorage("falso", path, token), "url exacta con el bucket de deps y el token sha256");
  const save = o.eventos.find((e) => e.op === "save" && e.path === path);
  assert.ok(save, `save() en el bucket para ${path}: ${JSON.stringify(o.eventos.map((e) => [e.op, e.path]))}`);
  assert.equal(save.bytes, mp4.length, "save() con el buffer entero");
  assert.equal(save.metadata?.contentType, "video/mp4", `save() con metadata.contentType (hay ${JSON.stringify(save.metadata)})`);
  assert.equal(save.metadata?.cacheControl, "public, max-age=31536000", `save() con cacheControl (hay ${JSON.stringify(save.metadata)})`);
  const conToken = (p: string, t: string) => o.eventos.some((e) => e.path === p && ((e.metadata?.metadata as Record<string, unknown> | undefined)?.firebaseStorageDownloadTokens === t));
  assert.ok(conToken(path, token), `el token de descarga ${token} queda en metadata.firebaseStorageDownloadTokens (save o setMetadata): ${JSON.stringify(o.eventos.filter((e) => e.path === path))}`);
  // Idempotencia: mismo contenido → misma url; contenido distinto → otra url (otro token).
  assert.ok(o.heroOtraVez.ok, `segunda subida del mismo contenido: ${o.heroOtraVez.error}`);
  assert.equal(o.heroOtraVez.ok.url, o.hero.ok.url, "el mismo contenido en el mismo rol/nombre produce la misma url");
  assert.ok(o.heroDistinto.ok, `subida de otro contenido: ${o.heroDistinto.error}`);
  assert.notEqual(o.heroDistinto.ok.url, o.hero.ok.url, "un contenido distinto produce otra url");
  assert.equal(o.heroDistinto.ok.url, urlStorage("falso", path, tokenDe(Buffer.from("otro contenido"))), "…con el token de ese contenido");
  // Nombre saneado: mismo rol, sin espacios ni paréntesis ni letras fuera de ASCII, con su extensión; la url codifica el path.
  assert.ok(o.saneado.ok, `«Mi Foto (1) ñ.JPG» debe subirse saneado: ${o.saneado.error}`);
  const m = o.saneado.ok.path.match(new RegExp(`^clients/${ID}/media/gallery/([A-Za-z0-9._-]+)$`));
  assert.ok(m, `path saneado bajo clients/${ID}/media/gallery/ sólo con [A-Za-z0-9._-] (hay «${o.saneado.ok.path}»)`);
  assert.match(m[1], /\.jpg$/i, "conserva la extensión");
  assert.equal(o.saneado.ok.url, urlStorage("falso", o.saneado.ok.path, tokenDe(Buffer.from("jpg"))), "url con el path codificado");
  // Tipos admitidos y topes: 5 MB imagen y 6 MB vídeo entran; un byte más no; text/plain no; y lo rechazado no se guarda.
  for (const [tipo, i] of Object.entries(o.tipos)) assert.ok(i.ok, `${tipo} debe admitirse: ${i.error}`);
  assert.ok(o.imagenTope.ok, `imagen de 5 MB exactos entra: ${o.imagenTope.error}`);
  assert.equal(o.imagenTope.ok.bytes, 5 * MB);
  assert.ok(o.videoTope.ok, `vídeo de 6 MB exactos entra: ${o.videoTope.error}`);
  assert.equal(o.videoTope.ok.bytes, 6 * MB);
  assert.ok(o.imagenExceso.error, "imagen de 5 MB + 1 byte lanza");
  assert.ok(o.imagenExceso.error.includes("grande.png") && /5\s?MB/.test(o.imagenExceso.error), `el error nombra el archivo y el límite: «${o.imagenExceso.error}»`);
  assert.ok(o.videoExceso.error, "vídeo de 6 MB + 1 byte lanza");
  assert.ok(o.videoExceso.error.includes("grande.webm") && /6\s?MB/.test(o.videoExceso.error), `el error nombra el archivo y el límite: «${o.videoExceso.error}»`);
  assert.ok(o.texto.error, "text/plain lanza");
  assert.ok(o.texto.error.includes("notas.txt"), `el error nombra el archivo: «${o.texto.error}»`);
  for (const n of ["grande.png", "grande.webm", "notas.txt"]) assert.ok(!o.eventos.some((e) => e.path.endsWith("/" + n)), `lo rechazado (${n}) no se guarda en el bucket`);
});

test("POST /api/upload/[clientId] usa subirMaterial: acepta además video/mp4 y video/webm (≤ 6 MB), toma el `rol` del campo `rol` del formulario (por defecto `images`, para la flota) y sigue devolviendo { urls, errors }; `resolveContentType` sale a src/lib/media-upload.ts y resuelve .mp4 y .webm por extensión", () => {
  // El fuente de la ruta: sobre el fuente entero se afirma con assert.ok(re.test(…)) para no volcarlo en el mensaje de fallo.
  const ruta = readFileSync(resolve(ROOT, RUTA), "utf8");
  assert.ok(/import\s*\{[^}]*\bsubirMaterial\b[^}]*\}\s*from\s*["'][^"']*media-upload(\.ts)?["']/.test(ruta), "la ruta importa subirMaterial de src/lib/media-upload");
  assert.ok(ruta.includes("video/mp4") && ruta.includes("video/webm"), "la ruta nombra video/mp4 y video/webm");
  assert.ok(/\.get\(\s*["']rol["']\s*\)/.test(ruta), "la ruta toma el campo «rol» del formulario (formData.get(\"rol\"))");
  assert.ok(ruta.includes('"images"'), "por defecto el rol es «images» (la flota sube a clients/<id>/media/images/)");
  assert.ok(ruta.includes("urls") && ruta.includes("errors"), "sigue devolviendo { urls, errors }");
  assert.ok(!/function\s+resolveContentType\b/.test(ruta), "resolveContentType ya no vive en la ruta");
  assert.ok(existsSync(resolve(ROOT, MEDIA_UPLOAD)), `falta ${MEDIA_UPLOAD}`);
  const lib = readFileSync(resolve(ROOT, MEDIA_UPLOAD), "utf8");
  assert.ok(/export\s+(async\s+)?(function|const)\s+resolveContentType\b/.test(lib), `${MEDIA_UPLOAD} exporta resolveContentType`);
  // resolveContentType(nombre, tipo) en proceso aparte: mp4 y webm por extensión; octet-stream cae a la extensión; tipo dado se respeta; desconocido → vacío.
  const r = nodeE(`import { resolveContentType } from ${URL_MEDIA};
console.log(JSON.stringify([resolveContentType("x.mp4", ""), resolveContentType("x.webm", ""), resolveContentType("x.jpg", "application/octet-stream"), resolveContentType("x.png", "image/png"), resolveContentType("x.xyz", "")]));`, { env: SIN_FIREBASE });
  assert.equal(r.status, 0, `resolveContentType debe importarse y correr (exit ${r.status})\n${r.out.slice(-2000)}`);
  const [mp4, webm, jpg, png, xyz] = ultimoJson(r) as unknown[];
  assert.equal(mp4, "video/mp4", "x.mp4 con tipo vacío → video/mp4");
  assert.equal(webm, "video/webm", "x.webm con tipo vacío → video/webm");
  assert.equal(jpg, "image/jpeg", "x.jpg con application/octet-stream → image/jpeg");
  assert.equal(png, "image/png", "un tipo dado se respeta");
  assert.ok(!xyz, `una extensión desconocida sin tipo no resuelve nada (hay ${JSON.stringify(xyz)})`);
});

/** Fixture mínimo con las diez rutas de material apuntando a /dev-fixtures/media/paleta-x/…; 12 archivos distintos, 15 apariciones. */
const P = "/dev-fixtures/media/paleta-x/";
const ARCHIVOS: [string, string][] = [
  ["hero.mp4", "hero"], ["hero.webm", "hero"], ["hero-poster.avif", "hero"], ["hero-v.mp4", "hero"], ["hero-v.webm", "hero"], ["hero-v-poster.avif", "hero"],
  ["servicio-1.png", "services"], ["galeria-1.png", "gallery"], ["retrato-1.jpg", "staff"], ["local.jpg", "branding"], ["local-v.jpg", "branding"], ["textura.jpg", "branding"],
];
const fixtureMinimo = () => ({
  business: { type: "peluqueria" },
  hero: { eyebrow: "טקסט", video: { mp4: P + "hero.mp4", webm: P + "hero.webm", poster: P + "hero-poster.avif", medium: { mp4: P + "hero.mp4", webm: P + "hero.webm" }, portrait: { mp4: P + "hero-v.mp4", webm: P + "hero-v.webm", poster: P + "hero-v-poster.avif" } } },
  sections: { services: { images: [P + "servicio-1.png", ""] }, gallery: { items: [{ id: "g-1", src: P + "galeria-1.png", type: "color" }] } },
  gallery: [P + "galeria-1.png"],
  staff: [{ name: "Noa", photoUrl: P + "retrato-1.jpg" }],
  branding: { localPhoto: P + "local.jpg", localPhotoMobile: P + "local-v.jpg", texture: P + "textura.jpg" },
});
const archivosBajo = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? archivosBajo(join(dir, n)) : [join(dir, n)])) : []);

test("scripts/b4-material.ts --paleta a|c [--fixture <ruta>] [--media <dir>] [--bucket-falso <dir>] [--solo <rol>] lee el fixture de T (`dev-fixtures/peluqueria-paleta-<p>.json`), sube con subirMaterial cada archivo referenciado bajo /dev-fixtures/media/ (hero.video.{mp4,webm,poster}, hero.video.medium.*, hero.video.portrait.*, sections.services.images[], sections.gallery.items[].src, gallery[], staff[].photoUrl, branding.localPhoto, branding.localPhotoMobile, branding.texture) a `clients/test-b4-peluqueria-<p>/media/<rol>/<nombre>` con rol hero|services|gallery|staff|branding, reescribe en el fixture de T cada referencia por su url (todas las apariciones del mismo archivo, la misma url), imprime una tabla archivo · rol · bytes · url y «subidos N · iguales M · reescritos K», sale 2 si un archivo referenciado no existe en disco; sólo ids con prefijo test-b4-peluqueria; con --bucket-falso <dir> escribe los archivos ahí y produce urls con bucket `falso` (para pruebas, sin red)", async () => {
  await conTemporalAsync(async (tmp) => {
    // Carpeta --media temporal: dos PNG generados con Playwright, cuatro clips y dos AVIF de unos bytes, cuatro JPG de unos bytes.
    const media = join(tmp, "media"), carpeta = join(media, "paleta-x");
    mkdirSync(carpeta, { recursive: true });
    const browser = await chromium.launch();
    try {
      const p = await browser.newPage({ viewport: { width: 24, height: 24 } });
      await p.setContent('<body style="margin:0;background:#c00000"></body>'); await p.screenshot({ path: join(carpeta, "servicio-1.png") });
      await p.setContent('<body style="margin:0;background:#0000c0"></body>'); await p.screenshot({ path: join(carpeta, "galeria-1.png") });
    } finally { await browser.close(); }
    for (const [n] of ARCHIVOS) if (!n.endsWith(".png")) writeFileSync(join(carpeta, n), `conexion-01 ${n}`);
    const bytes = new Map(ARCHIVOS.map(([n]) => [n, readFileSync(join(carpeta, n))]));
    const esperada = new Map(ARCHIVOS.map(([n, rol]) => [n, { rol, path: `clients/${ID}/media/${rol}/${n}`, url: urlStorage("falso", `clients/${ID}/media/${rol}/${n}`, tokenDe(bytes.get(n)!)) }]));
    const fx = join(tmp, "peluqueria-paleta-x.json"), bucket = join(tmp, "bucket");
    writeFileSync(fx, JSON.stringify(fixtureMinimo(), null, 2) + "\n");
    const correr = (...extra: string[]) => correrLargo(["--experimental-strip-types", SCRIPT, "--paleta", "x", "--fixture", fx, "--media", media, "--bucket-falso", bucket, ...extra], { env: SIN_FIREBASE });
    // Primera corrida: 12 subidos, 15 apariciones reescritas, tabla por archivo.
    const r1 = correr();
    assert.equal(r1.status, 0, `b4-material --paleta x --fixture … --media … --bucket-falso … debe salir 0 (salió ${r1.status})\n${r1.out.slice(-3000)}`);
    assert.match(r1.stdout, /^subidos 12 · iguales 0 · reescritos 15$/m, `resumen «subidos 12 · iguales 0 · reescritos 15»\n${r1.stdout.slice(-1500)}`);
    const lineas = r1.stdout.split(/\r?\n/);
    for (const [n, e] of esperada) assert.ok(lineas.some((l) => l.includes(n) && l.includes(e.rol) && l.includes(e.url)), `una línea de la tabla con «${n}», «${e.rol}» y su url\n${r1.stdout.slice(-1500)}`);
    // El fixture reescrito: cada referencia por su url exacta (bucket falso, token sha256), la misma url para el mismo archivo, lo demás intacto.
    const texto1 = readFileSync(fx, "utf8");
    assert.equal(cuenta(texto1, "/dev-fixtures/media"), 0, `el fixture ya no referencia /dev-fixtures/media\n${texto1.slice(0, 800)}`);
    const u = (n: string) => esperada.get(n)!.url;
    const f = JSON.parse(texto1);
    assert.equal(f.hero.video.mp4, u("hero.mp4")); assert.equal(f.hero.video.webm, u("hero.webm")); assert.equal(f.hero.video.poster, u("hero-poster.avif"));
    assert.equal(f.hero.video.medium.mp4, u("hero.mp4"), "medium.mp4 (el mismo archivo) lleva la misma url"); assert.equal(f.hero.video.medium.webm, u("hero.webm"));
    assert.equal(f.hero.video.portrait.mp4, u("hero-v.mp4")); assert.equal(f.hero.video.portrait.webm, u("hero-v.webm")); assert.equal(f.hero.video.portrait.poster, u("hero-v-poster.avif"));
    assert.deepEqual(f.sections.services.images, [u("servicio-1.png"), ""], "services.images: la url y la casilla vacía tal cual");
    assert.equal(f.sections.gallery.items[0].src, u("galeria-1.png")); assert.deepEqual(f.gallery, [u("galeria-1.png")]);
    assert.equal(f.sections.gallery.items[0].src, f.gallery[0], "la misma url para el mismo archivo aunque aparezca en gallery[] y en items[].src");
    assert.equal(f.staff[0].photoUrl, u("retrato-1.jpg")); assert.equal(f.branding.localPhoto, u("local.jpg")); assert.equal(f.branding.localPhotoMobile, u("local-v.jpg")); assert.equal(f.branding.texture, u("textura.jpg"));
    assert.equal(f.hero.eyebrow, "טקסט"); assert.equal(f.business.type, "peluqueria"); assert.equal(f.staff[0].name, "Noa"); assert.equal(f.sections.gallery.items[0].type, "color");
    assert.equal(cuenta(texto1, "/v0/b/falso/o/"), 15, "15 apariciones con bucket falso");
    // Los archivos en --bucket-falso: exactamente los 12, en clients/<id>/media/<rol>/<nombre>, byte a byte.
    for (const [n, e] of esperada) { const p = join(bucket, ...e.path.split("/")); assert.ok(existsSync(p), `falta ${e.path} en --bucket-falso`); assert.ok(readFileSync(p).equals(bytes.get(n)!), `${e.path} byte a byte`); }
    assert.equal(archivosBajo(bucket).length, 12, `sólo los 12 archivos en --bucket-falso: ${archivosBajo(bucket).map((p) => p.slice(bucket.length)).join(", ")}`);
    // Segunda corrida: nada que subir, 12 iguales, nada reescrito; el fixture no cambia ni un byte.
    const r2 = correr();
    assert.equal(r2.status, 0, `segunda corrida debe salir 0 (salió ${r2.status})\n${r2.out.slice(-3000)}`);
    assert.match(r2.stdout, /^subidos 0 · iguales 12 · reescritos 0$/m, `resumen «subidos 0 · iguales 12 · reescritos 0»\n${r2.stdout.slice(-1500)}`);
    assert.equal(readFileSync(fx, "utf8"), texto1, "la segunda corrida no reescribe el fixture");
    assert.equal(archivosBajo(bucket).length, 12);
    // Un archivo referenciado que no existe en disco → exit 2 nombrándolo.
    const fx3 = join(tmp, "falta.json"), bucket3 = join(tmp, "bucket3");
    const conFalta = fixtureMinimo(); conFalta.gallery.push(P + "no-existe.jpg");
    writeFileSync(fx3, JSON.stringify(conFalta, null, 2) + "\n");
    const r3 = correrLargo(["--experimental-strip-types", SCRIPT, "--paleta", "x", "--fixture", fx3, "--media", media, "--bucket-falso", bucket3], { env: SIN_FIREBASE });
    assert.equal(r3.status, 2, `con un archivo referenciado ausente debe salir 2 (salió ${r3.status})\n${r3.out.slice(-2000)}`);
    assert.ok(r3.out.includes("no-existe.jpg"), `nombra el archivo ausente\n${r3.out.slice(-2000)}`);
    assert.ok(readFileSync(fx3, "utf8").includes(P + "no-existe.jpg"), "la referencia ausente sigue en el fixture");
    // --paleta con un id fuera del prefijo test-b4-peluqueria (como segmento: «../fuera» escaparía de clients/test-b4-peluqueria-…/) → 2, sin escribir nada.
    const fx4 = join(tmp, "fuera.json"), bucket4 = join(tmp, "bucket4");
    writeFileSync(fx4, JSON.stringify(fixtureMinimo(), null, 2) + "\n");
    const r4 = correrLargo(["--experimental-strip-types", SCRIPT, "--paleta", "../fuera", "--fixture", fx4, "--media", media, "--bucket-falso", bucket4], { env: SIN_FIREBASE });
    assert.equal(r4.status, 2, `--paleta ../fuera debe salir 2 (salió ${r4.status})\n${r4.out.slice(-2000)}`);
    assert.match(r4.out, /test-b4-peluqueria|\.\.\/fuera/, `el rechazo nombra el prefijo exigido o el valor rechazado\n${r4.out.slice(-2000)}`);
    assert.deepEqual(archivosBajo(bucket4), [], "con un id rechazado no se escribe nada");
    assert.equal(cuenta(readFileSync(fx4, "utf8"), "/dev-fixtures/media"), 15, "…ni se reescribe el fixture");
  });
});
