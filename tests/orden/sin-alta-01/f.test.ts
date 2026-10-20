// SIN-ALTA-01 · F1–F5 (H) · la ficha y las pantallas del hub sin datos falsos.
// Sesión A (2026-10-20): tests rojos. La ruta /api/clients/[clientId] toca Firestore: se lee su fuente (§ Interfaz). Lo que la
// ficha y /payments muestran se afirma evaluando la expresión JSX que lo pinta, extraída del fuente (`bloqueConteniendo`).
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { FIRMA_LOGOMARK, ROOT, arbol, bloqueConteniendo, evaluarBloque, existe, fuente, importarModulo, pintar, texto } from "./_comun.ts";

const RUTA = "src/app/api/clients/[clientId]/route.ts";
const FICHA = "src/app/clients/[clientId]/page.tsx";
const PAGOS = "src/app/payments/page.tsx";
const MI_CUENTA = "src/app/mi-cuenta/page.tsx";

/** El cuerpo de `export const <VERBO> = …` de la ruta, hasta el siguiente export. */
function verbo(src: string, v: string): string {
  const i = src.indexOf(`export const ${v} `);
  assert.ok(i >= 0, `la ruta exporta ${v}`);
  const j = src.indexOf("\nexport ", i + 1);
  return src.slice(i, j < 0 ? undefined : j);
}
async function fechas() {
  const df = await import(pathToFileURL(resolve(ROOT, "node_modules/date-fns/index.js")).href).catch(() => import("date-fns"));
  const loc = await import(pathToFileURL(resolve(ROOT, "node_modules/date-fns/locale.js")).href).catch(() => import("date-fns/locale"));
  return { format: (df as any).format, es: (loc as any).es };
}

test("la ficha no fija importe: PATCH /api/clients/[id] con setupAmount responde 400 «Sólo se soporta language en PATCH.» sin escribir, el GET no devuelve setupAmount, y el panel de pagos de la ficha (PagoLinkPanel en src/components/pago-link-panel.tsx) muestra «₪250/mes, sin alta», el enlace /pago/<clientId> y Copiar, sin campo de importe; src/components/setup-amount-panel.tsx no existe", async () => {
  const ruta = fuente(RUTA);
  assert.ok(!/setupAmount/.test(ruta), `${RUTA} no debe leer ni escribir setupAmount (ni en el GET ni en el PATCH)`);
  const patch = verbo(ruta, "PATCH");
  const i400 = patch.indexOf('"Sólo se soporta language en PATCH."');
  assert.ok(i400 >= 0, "el PATCH responde «Sólo se soporta language en PATCH.»");
  assert.match(patch.slice(i400, i400 + 120), /status:\s*400/, "con 400");
  assert.match(patch.slice(0, i400), /if\s*\(\s*body\.language\s*===\s*undefined\s*\)\s*\{\s*return\s+NextResponse\.json\(\s*\{\s*error:\s*$/, "el 400 sale cuando no hay language");
  assert.ok(!/\.(set|update|add|delete)\(/.test(patch.slice(0, i400)), "antes de ese 400 no se escribe nada");
  assert.ok(!existe("src/components/setup-amount-panel.tsx"), "src/components/setup-amount-panel.tsx no existe");
  const m = await importarModulo("src/components/pago-link-panel.tsx");
  assert.ok(m?.PagoLinkPanel, "src/components/pago-link-panel.tsx exporta PagoLinkPanel");
  const html = await pintar(m.PagoLinkPanel, { tenantId: "cli-prueba" });
  assert.ok(texto(arbol(html)).includes("₪250/mes, sin alta"), "el panel dice «₪250/mes, sin alta»");
  assert.match(html, /href="\/pago\/cli-prueba"/, "el panel enlaza /pago/<clientId>");
  assert.ok(html.includes("Copiar"), "el panel tiene Copiar");
  assert.ok(!/<input|<select|<textarea/.test(html), "el panel no tiene campo de importe");
  const ficha = fuente(FICHA);
  assert.match(ficha, /<PagoLinkPanel\b[^>]*tenantId=/, "la ficha monta PagoLinkPanel");
  assert.ok(!/SetupAmountPanel|setup-amount-panel/.test(ficha), "la ficha no monta SetupAmountPanel");
});

test("/payments no muestra «Total setups» y mi-cuenta dice «Todo incluido, sin alta», sin «Alta única»", () => {
  assert.ok(!fuente(PAGOS).includes("Total setups"), "/payments sin «Total setups»");
  const mc = fuente(MI_CUENTA);
  assert.ok(mc.includes("Todo incluido, sin alta"), "mi-cuenta dice «Todo incluido, sin alta»");
  assert.ok(!mc.includes("Alta única"), "mi-cuenta sin «Alta única»");
});

test("el próximo cobro de la ficha es el de la suscripción: el GET de /api/clients/[id] devuelve paymentStatus y nextChargeAt (ISO o null) de hub_clients, y la ficha muestra «Próximo cobro: <fecha>» sólo con paymentStatus \"active\" o \"past_due\" y nextChargeAt (con «· atrasado» si es \"past_due\") y «Sin suscripción activa» en cualquier otro caso; ya no lo saca del nextBillingDate de un pago", async () => {
  const get = verbo(fuente(RUTA), "GET");
  assert.ok(/\bpaymentStatus:\s*[^,\n]*d\.paymentStatus/.test(get), "el GET devuelve paymentStatus de hub_clients");
  assert.ok(/\bnextChargeAt:\s*[^\n]*d\.nextChargeAt[^\n]*toISOString\(\)[^\n]*:\s*null/.test(get), "el GET devuelve nextChargeAt en ISO o null");
  const ficha = fuente(FICHA);
  assert.ok(!/payments\[0\]\.nextBillingDate/.test(ficha), "la ficha no saca el próximo cobro de payments[0].nextBillingDate");
  const bloque = bloqueConteniendo(ficha, ["Próximo cobro", "Sin suscripción activa"]);
  assert.ok(bloque, "la ficha tiene la expresión que pinta «Próximo cobro» / «Sin suscripción activa»");
  assert.ok(!bloque.includes("nextBillingDate"), "esa expresión no usa el nextBillingDate de un pago");
  const { format, es } = await fechas();
  const pagos = [{ nextBillingDate: new Date("2031-03-03T12:00:00Z"), billingDate: new Date("2031-02-03T12:00:00Z") }];
  const ver = (client: Record<string, unknown>) => evaluarBloque(bloque, { client, format, es, payments: pagos, locale: es });
  const iso = "2026-11-20T10:00:00.000Z";
  const activo = await ver({ paymentStatus: "active", nextChargeAt: iso });
  assert.match(activo, /Próximo cobro:\s*20 nov 2026/, `active: «${activo}»`);
  assert.ok(!activo.includes("atrasado") && !activo.includes("2031"), `active: «${activo}»`);
  const atrasado = await ver({ paymentStatus: "past_due", nextChargeAt: iso });
  assert.match(atrasado, /Próximo cobro:\s*20 nov 2026\s*· atrasado/, `past_due: «${atrasado}»`);
  for (const c of [{ paymentStatus: "active", nextChargeAt: null }, { paymentStatus: "cancelled", nextChargeAt: iso }, { paymentStatus: null, nextChargeAt: iso }, { paymentStatus: "pending", nextChargeAt: iso }, {}]) {
    assert.equal((await ver(c)).trim(), "Sin suscripción activa", `sin suscripción activa con ${JSON.stringify(c)}`);
  }
});

test("los montos de la ficha y de /payments van con separador de miles («₪1,500»), la columna de /payments se llama «Fecha» y no «Último cobro», y su «Próximo cobro» es «—» salvo en una cuota pagada con fecha válida", async () => {
  for (const rel of [FICHA, PAGOS]) {
    const src = fuente(rel);
    const montos = [...src.matchAll(/₪\{([^{}]+)\}|₪\$\{([^{}]+)\}/g)].map((m) => (m[1] ?? m[2]).trim());
    assert.ok(montos.length > 0, `${rel} pinta montos en ₪`);
    for (const e of montos) {
      const m = e.match(/^[\w$.?!]+?\.toLocaleString\(([\s\S]*)\)$/);
      assert.ok(m && m[1].trim(), `${rel}: «₪{${e}}» debe fijar el formato (toLocaleString con idioma), no depender del navegador`);
      const sale = new Function(`return (1500).toLocaleString(${m[1]})`)();
      assert.equal(sale, "1,500", `${rel}: «₪{${e}}» con 1500 da «₪${sale}»`);
    }
  }
  const pagos = fuente(PAGOS);
  assert.match(pagos, /<th\b[^>]*>\s*Fecha\s*<\/th>/, "/payments tiene la columna «Fecha»");
  assert.ok(!pagos.includes("Último cobro"), "/payments sin «Último cobro»");
  const bloque = bloqueConteniendo(pagos, ["nextBillingDate", '"—"']);
  assert.ok(bloque, "/payments tiene la expresión del «Próximo cobro» con «—»");
  const { format, es } = await fechas();
  const fecha = new Date("2026-12-05T12:00:00Z");
  const ver = (p: Record<string, unknown>) => evaluarBloque(bloque, { p, format, es });
  assert.match(await ver({ type: "recurring", status: "paid", nextBillingDate: fecha }), /05 dic 2026/, "cuota pagada con fecha válida → la fecha");
  for (const p of [
    { type: "recurring", status: "paid", nextBillingDate: new Date("x") },
    { type: "recurring", status: "paid", nextBillingDate: undefined },
    { type: "recurring", status: "pending", nextBillingDate: fecha },
    { type: "recurring", status: "failed", nextBillingDate: fecha },
    { type: "initial", status: "paid", nextBillingDate: fecha },
    { type: "initial", status: "pending", nextBillingDate: fecha },
  ]) assert.equal((await ver(p)).trim(), "—", `«—» con ${JSON.stringify(p)}`);
});

test("el menú lateral y el login del hub llevan la marca de Arzac (HubBrand en src/components/hub-brand.tsx: LogoMark y «Arzac studio») y ya no dicen «nichos-hub»", async () => {
  for (const rel of ["src/components/sidebar.tsx", "src/app/login/page.tsx"]) {
    const src = fuente(rel);
    assert.ok(!src.includes("nichos-hub"), `${rel} ya no dice «nichos-hub»`);
    assert.match(src, /import\s*\{\s*HubBrand\s*\}\s*from\s*"@\/components\/hub-brand"/, `${rel} importa HubBrand`);
    assert.match(src, /<HubBrand\b/, `${rel} pinta HubBrand`);
  }
  const m = await importarModulo("src/components/hub-brand.tsx");
  assert.ok(m?.HubBrand, "hub-brand.tsx exporta HubBrand");
  for (const props of [{}, { size: 28, textClass: "text-[28px]" }]) {
    const html = await pintar(m.HubBrand, props);
    assert.ok(html.includes(FIRMA_LOGOMARK), "HubBrand pinta LogoMark");
    assert.match(html.replace(/<!-- -->/g, ""), /Arzac\s*<em[^>]*>studio<\/em>/, "HubBrand dice «Arzac studio»");
  }
});
