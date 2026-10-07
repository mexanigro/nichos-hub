// MARCA-01 · W1 (H, webs) · la web de Yulia rehecha con el camino nuevo, todo el material en PASA, redesplegada y READY (D-294).
// Sesión A (2026-10-07): test rojo — no existe `tests/marca-01-yulia.json` y la web sirve el material de la plantilla A.
//
// Lee Firestore (Admin SDK de H), baja el material de Storage, mide con el `medir` de T (`medirConGama`, el mismo que usa la consola) y
// lee la API de Vercel: SÓLO lectura. Lleva la marca «, webs» (inciso s): `rojo-verde --todas` no la corre en HEAD; `--orden marca-01`
// entero, sí. Liam (2026-10-07, D-293) autorizó las escrituras en la web de Yulia, que hace B; este test no escribe nada.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PLANTILLAS, RUTA, YULIA, dbReal, deStorage, existe, fuente, hojas, importarModulo, sha256, vercel, type Cfg } from "./_comun.ts";

const REGISTRO = "tests/marca-01-yulia.json";
const PASOS = ["pedidos", "graduar", "chatgpt", "subir", "aprobar", "redeploy", "revisión"];
type Registro = { clientId: string; deployment: string; commitT: string; pasos: { paso: string; minutos: number }[]; huecos: { ruta: string; origen: string; excepcion?: string; sha256: string }[] };

test("la web de Yulia (demo--50af4398) rehecha con el camino nuevo: tests/marca-01-yulia.json registra su deployment, el commit de T, los minutos de cada paso (pedidos, graduar, ChatGPT, subir, aprobar, redeploy y revisión) y cada hueco con material, con su origen, su excepción si la tiene y el sha256 de sus bytes; su config de Firestore (lectura) tiene exactamente esos huecos, cada uno se baja y da ese sha256, ninguno es material de la plantilla A ni de la C, y no tiene branding.heroToBackdrop; aprobarMaterial con el medir de tools/gama.mjs del hermano T y esas excepciones da PASA en todos; y el deployment está READY en Vercel (lectura), es de su proyecto, su meta.githubCommitSha es el commit de T del registro y la variable VITE_OG_IMAGE de su proyecto es su brand.ogImage", async () => {
  // (1) El registro. Hoy no existe: aquí está el rojo.
  assert.ok(existe(REGISTRO), `falta ${REGISTRO} (D-294): la web de Yulia no se rehízo con el camino nuevo`);
  const reg = JSON.parse(fuente(REGISTRO)) as Registro;
  assert.equal(reg.clientId, YULIA.clientId, `${REGISTRO} es de la web de Yulia`);
  assert.match(reg.deployment ?? "", /^dpl_\w+$/, "registra el deployment");
  assert.match(reg.commitT ?? "", /^[0-9a-f]{7,40}$/, "registra el commit de T");
  for (const p of PASOS) {
    const paso = (reg.pasos ?? []).find((x) => x.paso.toLowerCase().startsWith(p));
    assert.ok(paso && typeof paso.minutos === "number" && paso.minutos > 0, `registra los minutos del paso «${p}» (la línea base del material)`);
  }
  assert.ok((reg.huecos ?? []).length > 0 && reg.huecos.every((h) => h.ruta && h.origen && /^[0-9a-f]{64}$/.test(h.sha256)), "cada hueco con su ruta, su origen y su sha256");

  // (2) Su config: exactamente esos huecos, servidos con esos bytes, nada de la plantilla y sin heroToBackdrop.
  const db = await dbReal();
  const config = (await db.collection("config").doc(YULIA.clientId).get()).data() as Cfg;
  assert.ok(config, `existe config/${YULIA.clientId}`);
  const conUrl = hojas(config).filter(([k, v]) => !k.startsWith("gallery.") && !k.startsWith("translations.") && deStorage(v)) as [string, string][];
  assert.deepEqual(conUrl.map(([k]) => k).sort(), reg.huecos.map((h) => h.ruta).sort(), "el config tiene exactamente los huecos del registro");
  const tokensPlantilla = new Map<string, string>();
  for (const p of ["a", "c"] as const) {
    const t = (await db.collection("config").doc(PLANTILLAS[p]).get()).data() as Cfg;
    for (const [, v] of hojas(t)) { const s = deStorage(v); if (s) tokensPlantilla.set(s.token, p.toUpperCase()); }
  }
  const faltas: string[] = [];
  const bajados = new Map<string, Buffer>();
  for (const [ruta, url] of conUrl) {
    const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (r.status !== 200) { faltas.push(`${ruta}: Storage responde ${r.status}`); continue; }
    const b = Buffer.from(await r.arrayBuffer()); bajados.set(url, b);
    const h = sha256(b), esperado = reg.huecos.find((x) => x.ruta === ruta)?.sha256;
    if (h !== esperado) faltas.push(`${ruta}: sha256 ${h.slice(0, 12)}…, el registro dice ${String(esperado).slice(0, 12)}…`);
    if (tokensPlantilla.has(h.slice(0, 32))) faltas.push(`${ruta}: es material de la plantilla ${tokensPlantilla.get(h.slice(0, 32))}`);
  }
  assert.equal(config.branding?.heroToBackdrop, undefined, "sin branding.heroToBackdrop (el de la plantilla A era un dato falso, D-290)");
  assert.deepEqual(faltas, [], "el material de Yulia que sirve Storage es el del registro, y nada es de la plantilla");

  // (3) La aprobación con el medir real de T: todo PASA.
  const { aprobarMaterial, medirConGama } = await importarModulo("src/lib/material-cliente.ts");
  const plantillas: Record<string, Cfg> = {};
  for (const p of ["a", "c"] as const) plantillas[p] = (await db.collection("config").doc(PLANTILLAS[p]).get()).data() as Cfg;
  const excepciones = Object.fromEntries(reg.huecos.filter((h) => h.excepcion).map((h) => [h.ruta, h.excepcion as string]));
  const ap = (await aprobarMaterial({ config, plantillas, excepciones }, {
    bajar: async (url: string) => { const b = bajados.get(url); return b ? { status: 200, bytes: b } : { status: (await fetch(url)).status }; },
    medir: await medirConGama(RUTA.T),
  })) as { pasa: boolean; huecos: { ruta: string; veredicto: string; motivos: string[] }[] };
  assert.deepEqual(ap.huecos.filter((h) => h.veredicto !== "PASA").map((h) => `${h.ruta}: ${h.motivos.join(" · ")}`), [], "aprobar: todo el material de Yulia PASA");
  assert.equal(ap.pasa, true);

  // (4) El Redeploy: READY, de su proyecto, en el commit de T del registro, con su imagen del link.
  const d = await vercel(`/v13/deployments/${reg.deployment}`);
  assert.equal(d.status, 200, `la API de Vercel devuelve el deployment ${reg.deployment} (${d.status})`);
  assert.equal(d.json.readyState, "READY", `el deployment está READY (está ${d.json.readyState})`);
  assert.equal(d.json.projectId, YULIA.proyecto, "es del proyecto de Yulia");
  assert.ok(String(d.json.meta?.githubCommitSha ?? "").startsWith(reg.commitT), `su meta.githubCommitSha (${d.json.meta?.githubCommitSha}) es el commit de T del registro (${reg.commitT})`);
  const env = await vercel(`/v10/projects/${YULIA.proyecto}/env?decrypt=true`);
  const og = ((env.json.envs ?? []) as Cfg[]).find((e) => e.key === "VITE_OG_IMAGE" && (e.target ?? []).includes("production"));
  assert.equal(og?.value, config.brand?.ogImage, "la variable VITE_OG_IMAGE de su proyecto es su brand.ogImage (el link muestra su imagen graduada)");
});
