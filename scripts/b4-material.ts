/**
 * CONEXION-01 (2026-09-21, D-20) · sube el material de un fixture de peluquería a Storage por la puerta del hub (subirMaterial) y
 * reescribe el fixture de T para que apunte a las urls servidas.
 *
 *   node --experimental-strip-types scripts/b4-material.ts --paleta a|c [--fixture <ruta>] [--media <dir>] [--bucket-falso <dir>] [--solo <rol>]
 *
 * Lee `T/dev-fixtures/peluqueria-paleta-<p>.json`, recorre las rutas de material (hero.video.*, hero.video.medium.*, hero.video.portrait.*,
 * sections.services.images[], sections.gallery.items[].src, gallery[], staff[].photoUrl, branding.localPhoto|localPhotoMobile|texture),
 * sube cada archivo distinto una vez a `clients/test-b4-peluqueria-<p>/media/<rol>/<nombre>` y sustituye cada aparición por su url
 * (textual: el resto del fixture queda byte a byte). Una referencia que ya es url de Storage se compara por token (sha256 del contenido
 * local): igual → «iguales»; distinta → se vuelve a subir y se reescribe. Un archivo referenciado que falta en disco → exit 2 sin
 * escribir nada. Sólo ids con prefijo test-b4-peluqueria (D-16): otro `--paleta` → exit 2 antes de tocar nada.
 * `--fixture` y `--media` sustituyen el fixture y `T/dev-fixtures/media` (pruebas); `--bucket-falso <dir>` guarda en disco con bucket
 * `falso` y no toca la red ni Firebase.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { type BucketMinimo, resolveContentType, subirMaterial, tokenDeContenido } from "../src/lib/media-upload.ts";

const PREFIJO = "test-b4-peluqueria";
const T = "C:/Users/liama/Desktop/Nichos/Barber-shop-template-main";
const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };

const paleta = arg("paleta");
if (!paleta) { console.error("b4-material: falta --paleta a|c"); process.exit(2); }
const CLIENT_ID = `${PREFIJO}-${paleta}`;
if (!/^[a-z0-9-]+$/.test(paleta) || !CLIENT_ID.startsWith(PREFIJO)) { console.error(`b4-material: --paleta «${paleta}» rechazado: el id debe ser «${PREFIJO}-<paleta>» con un solo segmento (D-16); no se tocó nada`); process.exit(2); }
const FIXTURE = resolve(arg("fixture") ?? `${T}/dev-fixtures/peluqueria-paleta-${paleta}.json`);
const MEDIA = resolve(arg("media") ?? `${T}/dev-fixtures/media`);
const BUCKET_FALSO = arg("bucket-falso");
const SOLO = arg("solo");

/** Rutas de material del fixture y el rol bajo el que viven en Storage. `[]` recorre un array. */
const RUTAS: [string, string][] = [
  ["hero.video.mp4", "hero"], ["hero.video.webm", "hero"], ["hero.video.poster", "hero"],
  ["hero.video.medium.mp4", "hero"], ["hero.video.medium.webm", "hero"], ["hero.video.medium.poster", "hero"],
  ["hero.video.portrait.mp4", "hero"], ["hero.video.portrait.webm", "hero"], ["hero.video.portrait.poster", "hero"],
  ["sections.services.images[]", "services"], ["sections.gallery.items[].src", "gallery"], ["gallery[]", "gallery"],
  ["staff[].photoUrl", "staff"],
  ["branding.localPhoto", "branding"], ["branding.localPhotoMobile", "branding"], ["branding.texture", "branding"],
];

/** Bucket en disco: `<dir>/<path>`; urls con bucket «falso». */
function bucketFalso(dir: string): BucketMinimo {
  return {
    name: "falso",
    file(path) {
      const abs = resolve(dir, ...path.split("/"));
      return {
        async save(buffer) { mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, buffer); },
        async exists() { return [existsSync(abs)]; },
      };
    },
  };
}

/** Variables de .env.local del hub (como b4-tenant.ts), sólo cuando se va al bucket real. */
function cargarEnv() {
  for (const line of readFileSync(resolve(import.meta.dirname, "../.env.local"), "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[t.slice(0, i).trim()] = v;
  }
}

/** Recorre `ruta` (con puntos y `[]`) y llama `fn` con cada hoja. */
function visitar(nodo: unknown, partes: string[], fn: (hoja: unknown) => void): void {
  if (partes.length === 0) { fn(nodo); return; }
  const [p, ...resto] = partes;
  if (p.endsWith("[]")) {
    const arr = (nodo as Record<string, unknown> | null)?.[p.slice(0, -2)];
    if (Array.isArray(arr)) for (const v of arr) visitar(v, resto, fn);
  } else if (nodo && typeof nodo === "object" && p in (nodo as object)) {
    visitar((nodo as Record<string, unknown>)[p], resto, fn);
  }
}

const LOCAL = "/dev-fixtures/media/";
const PREFIJO_URL = `https://firebasestorage.googleapis.com/v0/b/`;
const SEGMENTO = `clients%2F${CLIENT_ID}%2Fmedia%2F`;

/** Nombre de archivo de una referencia: local (`/dev-fixtures/media/paleta-<p>/<nombre>`) o url de Storage de este id; otra cosa → null. */
function nombreDe(ref: string): { nombre: string; token?: string } | null {
  if (ref.startsWith(LOCAL)) return { nombre: ref.slice(ref.lastIndexOf("/") + 1) };
  if (ref.startsWith(PREFIJO_URL) && ref.includes(SEGMENTO)) {
    const path = decodeURIComponent(ref.slice(ref.indexOf("/o/") + 3, ref.indexOf("?")));
    return { nombre: path.slice(path.lastIndexOf("/") + 1), token: ref.slice(ref.indexOf("&token=") + 7) };
  }
  return null;
}

const texto = readFileSync(FIXTURE, "utf8");
const fixture = JSON.parse(texto) as Record<string, unknown>;

// 1. Recoger referencias: ref → rol, y comprobar que cada archivo existe en disco antes de subir nada.
const refs = new Map<string, string>();
for (const [ruta, rol] of RUTAS) {
  if (SOLO && rol !== SOLO) continue;
  visitar(fixture, ruta.split("."), (hoja) => {
    if (typeof hoja !== "string" || !nombreDe(hoja)) return;
    const previo = refs.get(hoja);
    if (previo && previo !== rol) { console.error(`b4-material: «${hoja}» aparece bajo dos roles (${previo}, ${rol}); no se tocó nada`); process.exit(2); }
    refs.set(hoja, rol);
  });
}
const faltan = [...refs.keys()].map((r) => nombreDe(r)!.nombre).filter((n) => !existsSync(resolve(MEDIA, `paleta-${paleta}`, n)));
if (faltan.length) { console.error(`b4-material: ${faltan.length} archivo(s) referenciado(s) no existe(n) en ${MEDIA}/paleta-${paleta}: ${faltan.join(", ")}; no se tocó nada`); process.exit(2); }

// 2. Subir cada archivo distinto (rol/nombre) una vez; una url ya en el fixture con el token del contenido local cuenta como igual.
let bucket: BucketMinimo;
if (BUCKET_FALSO) bucket = bucketFalso(BUCKET_FALSO);
else { cargarEnv(); bucket = (await import("../src/lib/firebase-admin.ts")).getStorageBucket(); }
const urlPor = new Map<string, string>();
const hechos = new Map<string, { url: string; bytes: number; nombre: string; rol: string }>();
let subidos = 0, iguales = 0;
for (const [ref, rol] of refs) {
  const { nombre, token } = nombreDe(ref)!;
  const clave = `${rol}/${nombre}`;
  if (!hechos.has(clave)) {
    const buffer = readFileSync(resolve(MEDIA, `paleta-${paleta}`, nombre));
    const contentType = resolveContentType(nombre, "");
    const entrada = { clientId: CLIENT_ID, rol, nombre, buffer, contentType };
    const path = `clients/${CLIENT_ID}/media/${rol}/${nombre}`;
    const yaEsta = token === tokenDeContenido(buffer) && (await bucket.file(path).exists?.())?.[0] === true;
    const r = yaEsta ? { url: ref, path, bytes: buffer.length } : await subirMaterial(entrada, { bucket });
    if (yaEsta) iguales++; else subidos++;
    hechos.set(clave, { url: r.url, bytes: r.bytes, nombre, rol });
    console.log(`${nombre} · ${rol} · ${r.bytes} · ${r.url}`);
  }
  urlPor.set(ref, hechos.get(clave)!.url);
}

// 3. Reescritura textual: cada aparición `"<ref>"` → `"<url>"`; lo demás byte a byte.
let salida = texto, reescritos = 0;
for (const [ref, url] of urlPor) {
  if (ref === url) continue;
  const partes = salida.split(JSON.stringify(ref));
  reescritos += partes.length - 1;
  salida = partes.join(JSON.stringify(url));
}
if (salida !== texto) writeFileSync(FIXTURE, salida);
console.log(`subidos ${subidos} · iguales ${iguales} · reescritos ${reescritos}`);
