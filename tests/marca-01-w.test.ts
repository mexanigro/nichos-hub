// MARCA-01 · copia promovida (CRM-03, 2026-10-16, D-312) de tests/orden/marca-01/w.test.ts. La orden quedó aprobada por Liam
// el 2026-10-08 (T 96bceb2 · H 17fd18b) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte: sólo el registro (la parte 1 de W1): Firestore, Storage y Vercel quedan en la orden congelada, que lleva «, webs».
import { test } from "node:test";
import assert from "node:assert/strict";
import { YULIA, existe, fuente } from "./orden/marca-01/_comun.ts";

const REGISTRO = "tests/marca-01-yulia.json";
const PASOS = ["pedidos", "graduar", "chatgpt", "subir", "aprobar", "redeploy", "revisión"];
type Registro = { clientId: string; deployment: string; commitT: string; pasos: { paso: string; minutos: number }[]; huecos: { ruta: string; origen: string; excepcion?: string; sha256: string }[] };

test("tests/marca-01-yulia.json registra la web de Yulia: su clientId, su deployment, el commit de T, los minutos de cada paso y cada hueco con su ruta, su origen y su sha256 (la copia de W1, sólo con el registro)", () => {
  // (1) El registro.
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

});
