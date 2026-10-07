/**
 * material.ts — MARCA-01 (M1-5, M1-6, D-288, D-289, D-293, inciso y). El material de la web de una clienta, por consola.
 *
 *   pedidos: el pedido de ChatGPT de cada hueco, armado de su paleta y de la descripción de su salón (una conversación por foto, con
 *   su local.jpg adjunto). Escribe <salida>/pedidos.md y <salida>/paleta.json (la que lee tools/material/graduar.mjs --colores).
 *     node --experimental-strip-types scripts/material.ts pedidos --id <clientId> --salon <salon.txt> --salida <dir>
 *   subir: cada archivo de <carpeta> con un nombre fijo de las casillas (hero.mp4, hero-v.webm, hero-poster.avif, textura.jpg,
 *   local.jpg, local-v.jpg, og.jpg, servicio-<n>, galeria-<n>, retrato-<n>…) a su hueco, por subirMaterial y guardarConfig. EN SECO
 *   por defecto (dice qué haría); sube y escribe sólo con --aplicar.
 *     node --experimental-strip-types scripts/material.ts subir --id <clientId> --carpeta <dir> [--aplicar]
 *   aprobar: baja cada hueco de Storage y lo mide con el `medir` de tools/gama.mjs del hermano T (medirConGama), hueco por hueco
 *   PASA o NO y por qué. Sale 1 si algo no pasa: lo que no pasa no se publica. Las excepciones de M1-3 se dan por hueco.
 *     node --experimental-strip-types scripts/material.ts aprobar --id <clientId> [--excepcion <ruta>=<motivo>]… [--t <raíz de T>]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const [modo, ...argv] = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
const id = arg("id");
const USO = [
  "uso: material pedidos --id <clientId> --salon <salon.txt> --salida <dir>",
  "     material subir   --id <clientId> --carpeta <dir> [--aplicar]",
  "     material aprobar --id <clientId> [--excepcion <ruta>=<motivo>]… [--t <raíz de T>]",
].join("\n");
const falta = !id || (modo === "pedidos" && (!arg("salon") || !arg("salida"))) || (modo === "subir" && !arg("carpeta"));
if (!["pedidos", "subir", "aprobar"].includes(modo ?? "") || falta) { console.error(USO); process.exit(2); }

/** El hermano T por su ruta fija (como ROOTS de tools/_git.mjs); --t la cambia. */
const RAIZ_T = arg("t") ?? "C:/Users/liama/Desktop/Nichos/Barber-shop-template-main";

// Sólo las credenciales de Firebase de .env.local (nada más entra al proceso).
for (const linea of readFileSync(resolve(import.meta.dirname, "../.env.local"), "utf8").split(/\r?\n/)) {
  const t = linea.trim(), i = t.indexOf("=");
  if (!t || t.startsWith("#") || i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (/^(NEXT_PUBLIC_)?FIREBASE_/.test(k)) process.env[k] ??= v;
}
const { db, getStorageBucket } = await import("../src/lib/firebase-admin.ts");
const { aprobarMaterial, avisosDeMaterial, leerPlantillas, medirConGama, subirCarpeta } = await import("../src/lib/material-cliente.ts");
type Db = Parameters<typeof subirCarpeta>[1]["db"];
const leerConfig = async (): Promise<Record<string, any>> => {
  const s = await db.collection("config").doc(id!).get();
  if (!s.exists) throw new Error(`«${id}» no existe (no hay config/${id})`);
  return s.data() ?? {};
};

const inicio = Date.now();
try {
  if (modo === "pedidos") {
    const { pedidosDeMaterial, pedidosEnMarkdown } = await import("../src/lib/pedidos-chatgpt.ts");
    const config = await leerConfig();
    const pedidos = pedidosDeMaterial(config, readFileSync(arg("salon")!, "utf8").trim());
    mkdirSync(arg("salida")!, { recursive: true });
    writeFileSync(join(arg("salida")!, "pedidos.md"), pedidosEnMarkdown(id!, pedidos));
    writeFileSync(join(arg("salida")!, "paleta.json"), JSON.stringify({ branding: { mode: config.branding?.mode ?? "light", colors: config.branding?.colors ?? {} } }, null, 1) + "\n");
    console.log(`pedidos ${id} · ${pedidos.length} pedidos → ${join(arg("salida")!, "pedidos.md")} (y paleta.json para graduar.mjs --colores)`);
    for (const p of pedidos) console.log(`  ${p.hueco.padEnd(8)} ${p.ruta}`);
  } else if (modo === "subir") {
    const dir = arg("carpeta")!, aplicar = argv.includes("--aplicar");
    if (!existsSync(dir)) throw new Error(`no existe la carpeta ${dir}`);
    const archivos = readdirSync(dir).filter((n) => !n.startsWith(".") && statSync(join(dir, n)).isFile()).sort().map((nombre) => ({ nombre, bytes: readFileSync(join(dir, nombre)) }));
    const r = await subirCarpeta({ clientId: id!, archivos, aplicar }, { db: db as unknown as Db, bucket: getStorageBucket() as never });
    console.log(`subir ${id} · ${aplicar ? "APLICADO" : "EN SECO (nada subido ni escrito; repetir con --aplicar)"} · ${r.huecos.length} archivos`);
    for (const h of r.huecos) console.log(`  ${h.nombre.padEnd(20)} → ${h.ruta}${"url" in h && h.url ? `  ${h.url}` : ""}`);
    console.log(`escrito: ${r.escrito ? "sí" : "no"}`);
  } else {
    const excepciones: Record<string, string> = {};
    argv.forEach((a, i) => { if (a === "--excepcion") { const [ruta, ...m] = String(argv[i + 1] ?? "").split("="); if (ruta && m.length) excepciones[ruta] = m.join("="); } });
    const config = await leerConfig();
    const r = await aprobarMaterial({ config, plantillas: await leerPlantillas(db as unknown as Db), excepciones }, {
      bajar: async (url: string) => { const res = await fetch(url, { signal: AbortSignal.timeout(60000) }); return res.ok ? { status: res.status, bytes: Buffer.from(await res.arrayBuffer()) } : { status: res.status }; },
      medir: await medirConGama(RAIZ_T),
    });
    console.log(`aprobar ${id} · medido con ${RAIZ_T}/tools/gama.mjs`);
    for (const h of r.huecos) console.log(`  ${h.veredicto === "PASA" ? "PASA" : "NO  "} ${h.ruta}${excepciones[h.ruta] ? ` (excepción: ${excepciones[h.ruta]})` : ""}${h.motivos.length ? ` — ${h.motivos.join(" · ")}` : ""}`);
    const avisos = avisosDeMaterial(r);
    console.log(avisos.length ? `AVISOS (material: lo que no pasa no se publica; se gradúa o se vuelve a pedir):\n${avisos.map((a) => `  ! ${a.message}`).join("\n")}` : "avisos: ninguno (todo el material PASA)");
    console.log(`${r.huecos.filter((h) => h.veredicto === "PASA").length}/${r.huecos.length} PASA · ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
    process.exit(r.pasa ? 0 : 1);
  }
  process.exit(0);
} catch (err) {
  console.error(`material ${modo}: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
