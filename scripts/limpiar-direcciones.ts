/**
 * limpiar-direcciones.ts — CIERRE-TRAMO-01 (C3; Liam, 2026-10-03). Desde C3, `validateConfig` da error por un campo de
 * `contact.address` que no es calle, barrio ni ciudad (`street`, `district`, `cityStateZip`), y la pestaña Config manda el config
 * entero: una ficha con lo que escribía el alta viejo (`city`, `country`, `full`) no se puede guardar. Este script lo limpia:
 * `city` → `cityStateZip` (si `cityStateZip` está vacío; si no, `city` se borra) y se borran los demás campos desconocidos.
 *
 * Por defecto SÓLO LEE (`.get()`) e imprime, por config/{id}, el antes y el después. Escribe sólo con `--aplicar --ids <id1,id2,…>`
 * (ids explícitos, que tienen que estar entre los que necesitan limpieza) y sólo los campos de `contact.address` que cambian
 * (`update` con `FieldValue.delete()`). Ojo: con `cityStateZip` puesto, la ciudad pasa a verse en la web de esa ficha.
 *
 *   node --experimental-strip-types scripts/limpiar-direcciones.ts
 *   node --experimental-strip-types scripts/limpiar-direcciones.ts --aplicar --ids demo-future-tattoo,demo-igal-tattz
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const CAMPOS = ["street", "district", "cityStateZip"];

/** El cambio de una dirección: lo que queda y lo que se escribe (null = borrar). Sin nada que cambiar, null. */
export function limpieza(address: unknown): { despues: Record<string, unknown>; cambios: Record<string, unknown> } | null {
  if (!address || typeof address !== "object" || Array.isArray(address)) return null;
  const antes = address as Record<string, unknown>;
  const despues: Record<string, unknown> = {};
  const cambios: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(antes)) if (CAMPOS.includes(k)) despues[k] = v;
  for (const k of Object.keys(antes)) if (!CAMPOS.includes(k)) cambios[k] = null;
  if (typeof antes.city === "string" && antes.city.trim() && !(typeof antes.cityStateZip === "string" && antes.cityStateZip.trim())) {
    despues.cityStateZip = antes.city;
    cambios.cityStateZip = antes.city;
  }
  return Object.keys(cambios).length ? { despues, cambios } : null;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  for (const line of readFileSync(resolve(import.meta.dirname, "../.env.local"), "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[t.slice(0, i).trim()] = v;
  }
  let key = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (/^["'`]/.test(key) && key[0] === key[key.length - 1]) key = key.slice(1, -1);
  initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: key }) });
  const db = process.env.FIREBASE_DATABASE_ID ? getFirestore(process.env.FIREBASE_DATABASE_ID) : getFirestore();
  db.settings({ preferRest: true });

  const aplicar = process.argv.includes("--aplicar");
  const i = process.argv.indexOf("--ids");
  const ids = i > 0 ? (process.argv[i + 1] ?? "").split(",").filter(Boolean) : [];
  if (aplicar && !ids.length) { console.error("limpiar-direcciones: --aplicar exige --ids <id1,id2,…>; no se escribió nada"); process.exit(2); }

  const snap = await db.collection("config").get();
  const pendientes = new Map<string, NonNullable<ReturnType<typeof limpieza>>>();
  for (const d of snap.docs) {
    const antes = d.data()?.contact?.address;
    const l = limpieza(antes);
    if (!l) continue;
    pendientes.set(d.id, l);
    console.log(`${d.id}\n  antes:   ${JSON.stringify(antes)}\n  después: ${JSON.stringify(l.despues)}`);
  }
  console.log(`config: ${snap.size} documentos · a limpiar: ${pendientes.size}`);
  if (!aplicar) { console.log("sólo lectura: no se escribió nada (para escribir: --aplicar --ids …)"); process.exit(0); }

  const ajenos = ids.filter((id) => !pendientes.has(id));
  if (ajenos.length) { console.error(`limpiar-direcciones: ${ajenos.join(", ")} no necesita(n) limpieza; no se escribió nada`); process.exit(2); }
  for (const id of ids) {
    const upd = Object.fromEntries(Object.entries(pendientes.get(id)!.cambios).map(([k, v]) => [`contact.address.${k}`, v === null ? FieldValue.delete() : v]));
    await db.collection("config").doc(id).update(upd);
    const leido = (await db.collection("config").doc(id).get()).data()?.contact?.address;
    console.log(`escrito ${id} · ahora: ${JSON.stringify(leido)}`);
  }
  process.exit(0);
}
