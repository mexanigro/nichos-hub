// CRM-05 · H1, H2 (H) · el hub: «Suspender» que apaga la web (D-361) y el email de la dueña sólo de `hub_clients` (D-367).
// Sesión A (2026-10-25): tests rojos. Sesión A2 (2026-10-25): E2 (H), el párrafo CRM-04 de CLAUDE.md de H al día (D-385), al final.
//
// Medido en H 89cfb98: el PUT de `src/app/api/clients/route.ts:113-150` escribe `hub_clients/{id}` y `clients/{clientId}.status` con
// `merge` y no pausa nada; sólo el kill (`kill/route.ts:42-61`) llama a `https://api.vercel.com/v1/projects/<id>/pause|unpause`, así que
// una web suspendida desde la ficha se sigue viendo normal. `resolveOwnerNotificationEmail` prefiere el `adminEmail` del config, que
// escribe el negocio (`src/lib/provisioning.ts:92-95`). Contrato (§ Interfaz de la hoja): `src/lib/estado-cliente.ts` exporta
// `accionDeEstado(antes, despues) → "pausar" | "despausar" | null` (pura) y `aplicarAccionEnVercel(accion, { vercelProjectId, token,
// teamId?, fetch }) → Promise<{ ok, status }>` (la llamada a Vercel, con `fetch` inyectado), y el PUT de clientes las llama (se lee el
// cableado, como Q2 de CRM-04). Caja negra: `import()` dinámico con el cargador de .ts/.tsx; ningún test sale a la red.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existe, fuente, importarModulo, parrafoDe } from "./_comun.ts";

/** El texto de la declaración `export const <nombre> =` / `function <nombre>(` / `const <nombre> =` de `texto`, hasta la siguiente
 *  declaración de primer nivel; null si no está. */
function declaracion(texto: string, nombre: string): string | null {
  const re = new RegExp(`^(?:export\\s+)?(?:async\\s+)?(?:const|let|function)\\s+${nombre}\\b`, "m");
  const m = re.exec(texto);
  if (!m) return null;
  const resto = texto.slice(m.index + m[0].length);
  const fin = resto.search(/^(?:export\s+|const\s+|let\s+|function\s+|async\s+function\s+)/m);
  return m[0] + (fin < 0 ? resto : resto.slice(0, fin));
}
/** ¿El PUT llama a `fn(` —en su cuerpo o en una función que llama, del mismo archivo o importada de `@/…` o de una ruta relativa—? Un nivel. */
function llama(archivo: string, bloque: string, fn: string): boolean {
  if (bloque.includes(`${fn}(`)) return true;
  const texto = fuente(archivo);
  const imports = new Map<string, string>();
  for (const m of texto.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) for (const n of m[1].split(",").map((x) => x.trim().split(/\s+as\s+/).pop()!).filter(Boolean)) imports.set(n, m[2]);
  for (const [, nombre] of bloque.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (nombre === fn) return true;
    const local = declaracion(texto, nombre);
    if (local && local.includes(`${fn}(`)) return true;
    const desde = imports.get(nombre);
    if (!desde) continue;
    const base = desde.startsWith("@/") ? `src/${desde.slice(2)}` : desde.startsWith(".") ? `${archivo.replace(/[^/]+$/, "")}${desde}` : null;
    const rel = base && [".ts", ".tsx", "/index.ts"].map((e) => base + e).find((p) => existe(p));
    const d = rel ? declaracion(fuente(rel), nombre) : null;
    if (d && d.includes(`${fn}(`)) return true;
  }
  return false;
}

test("suspender o archivar un cliente desde el hub pausa su proyecto de Vercel, y volver a \"active\" lo despausa", async () => {
  const fallas: string[] = [];
  const m = await importarModulo("src/lib/estado-cliente.ts");
  if (typeof m?.accionDeEstado !== "function" || typeof m?.aplicarAccionEnVercel !== "function") fallas.push("src/lib/estado-cliente.ts exporta accionDeEstado(antes, despues) y aplicarAccionEnVercel(accion, { vercelProjectId, token, teamId, fetch })");
  else {
    const casos: [string | undefined, string, string | null][] = [
      ["active", "suspended", "pausar"], ["active", "archived", "pausar"], ["trial", "suspended", "pausar"], ["maintenance", "archived", "pausar"],
      ["suspended", "active", "despausar"], ["archived", "active", "despausar"],
      ["active", "active", null], ["suspended", "suspended", null], ["archived", "archived", null],
    ];
    for (const [antes, despues, espera] of casos) {
      const v = m.accionDeEstado(antes, despues);
      if (v !== espera) fallas.push(`accionDeEstado(${JSON.stringify(antes)}, "${despues}") = ${JSON.stringify(espera)} (hoy ${JSON.stringify(v)})`);
    }
    for (const [accion, ruta] of [["pausar", "pause"], ["despausar", "unpause"]] as const) {
      const llamadas: { url: string; metodo: string; auth: string }[] = [];
      const falso = async (url: any, init: any = {}) => {
        llamadas.push({ url: String(url), metodo: String(init.method ?? "GET").toUpperCase(), auth: String(new Headers(init.headers).get("authorization") ?? "") });
        return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
      };
      let r: any;
      try { r = await m.aplicarAccionEnVercel(accion, { vercelProjectId: "prj_salon", token: "tk-prueba", teamId: "team_arzac", fetch: falso }); } catch (e) { r = { error: (e as Error).message }; }
      const u = llamadas[0];
      if (llamadas.length !== 1 || u.metodo !== "POST" || u.url !== `https://api.vercel.com/v1/projects/prj_salon/${ruta}?teamId=team_arzac` || u.auth !== "Bearer tk-prueba") fallas.push(`aplicarAccionEnVercel("${accion}") hace POST https://api.vercel.com/v1/projects/prj_salon/${ruta}?teamId=team_arzac con el token (hoy ${JSON.stringify(llamadas)})`);
      if (r?.ok !== true) fallas.push(`aplicarAccionEnVercel("${accion}") con Vercel respondiendo 200 da ok (hoy ${JSON.stringify(r)})`);
      let rMal: any;
      try { rMal = await m.aplicarAccionEnVercel(accion, { vercelProjectId: "prj_salon", token: "tk-prueba", fetch: async () => new Response("{}", { status: 403 }) }); } catch (e) { rMal = { error: (e as Error).message }; }
      if (rMal?.ok !== false || rMal?.status !== 403) fallas.push(`aplicarAccionEnVercel("${accion}") con Vercel respondiendo 403 da { ok: false, status: 403 } (hoy ${JSON.stringify(rMal)})`);
    }
  }
  // El cableado: el PUT de la ficha (el que escribe el estado) decide con accionDeEstado y llama a Vercel con aplicarAccionEnVercel.
  const archivo = "src/app/api/clients/route.ts";
  const put = existe(archivo) ? declaracion(fuente(archivo), "PUT") : null;
  if (!put) fallas.push(`${archivo} declara PUT`);
  else for (const fn of ["accionDeEstado", "aplicarAccionEnVercel"]) if (!llama(archivo, put, fn)) fallas.push(`el PUT de ${archivo} llama a ${fn}`);
  assert.deepEqual(fallas, [], `H1 · «Suspender» apaga la web:\n${fallas.join("\n")}`);
});

test("`resolveOwnerNotificationEmail` devuelve el `adminEmail` de `hub_clients` aunque `config.adminEmail` diga otro", async () => {
  const fallas: string[] = [];
  const pv = await importarModulo("src/lib/provisioning.ts");
  if (typeof pv?.resolveOwnerNotificationEmail !== "function") fallas.push("src/lib/provisioning.ts exporta resolveOwnerNotificationEmail");
  else {
    const casos: [Record<string, unknown>, Record<string, unknown>, string][] = [
      [{ adminEmail: "intrusa@gmail.com" }, { adminEmail: "duena@salon.co.il" }, "duena@salon.co.il"],
      [{ adminEmail: "Gerente@Salon.co.il" }, { adminEmail: "duena@salon.co.il" }, "duena@salon.co.il"],
      [{ adminEmail: "duena@salon.co.il" }, { adminEmail: "duena@salon.co.il" }, "duena@salon.co.il"],
      [{}, { adminEmail: "duena@salon.co.il" }, "duena@salon.co.il"],
    ];
    for (const [cfg, hub, espera] of casos) {
      let v: unknown;
      try { v = pv.resolveOwnerNotificationEmail(cfg, hub); } catch (e) { v = `lanzó: ${(e as Error).message}`; }
      if (v !== espera) fallas.push(`resolveOwnerNotificationEmail(${JSON.stringify(cfg)}, ${JSON.stringify(hub)}) = "${espera}" (hoy ${JSON.stringify(v)})`);
    }
  }
  assert.deepEqual(fallas, [], `H2 · el email de la dueña sale del hub:\n${fallas.join("\n")}`);
});

// E2 (D-385): la verificadora de CRM-04 midió que el párrafo CRM-04 de H dice «Q5 tiene una carrera» y «el verde de T se reaplica
// después», y el de T ya cuenta el rojo corregido (D-355, D-356) y el verde reaplicado. Se lee el párrafo «**CRM-04 (AAAA-MM-DD):**» de
// § Puertas automáticas de CLAUDE.md de H.
test("el párrafo CRM-04 de CLAUDE.md de H nombra D-355 y D-356", () => {
  const p = parrafoDe(fuente("CLAUDE.md"), "CRM-04");
  const fallas = !p ? ["§ Puertas automáticas de H tiene un párrafo «**CRM-04 (AAAA-MM-DD):**»"] : ["D-355", "D-356"].filter((d) => !p.includes(d)).map((d) => `el párrafo CRM-04 de H nombra ${d}`);
  assert.deepEqual(fallas, [], `E2 · el párrafo CRM-04 de H:\n${fallas.join("\n")}`);
});
