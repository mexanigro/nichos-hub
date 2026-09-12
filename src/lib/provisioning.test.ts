/**
 * N08 T0 — contrato del alta de una web desde el hub (n08-apertura-v1).
 * Filas 1–3: hoy RED (config sin catálogo, sin adminEmail; sin bootstrap del dueño).
 * Fila 4: RED (deploy.ts sólo lee config.adminEmail). Filas 5–6: contrato conservado.
 * Fila 7 (T1): el catálogo sembrado es el del preset del template (por id/duración/precio).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { buildProvisionDocs, resolveOwnerNotificationEmail } from "./provisioning.ts";

const base = {
  businessName: "  Barbería N08 ",
  niche: "barberia" as const,
  mode: "team" as const,
  slug: "demo-barberia-n08-abcd1234",
  domain: "demo-barberia-n08-abcd1234.arzac.studio",
  language: "he" as const,
  email: "contacto@n08.test",
  adminEmail: "Owner@N08.test",
  now: new Date("2026-09-12T12:00:00Z"),
};

test("1 · config nace con el catálogo del nicho: services, staff y businessRules", () => {
  const { config } = buildProvisionDocs(base);
  const services = config.services as Array<Record<string, unknown>>;
  const staff = config.staff as Array<Record<string, unknown>>;
  assert.ok(Array.isArray(services) && services.length >= 1, "config.services ausente");
  assert.ok(Array.isArray(staff) && staff.length >= 1, "config.staff ausente");
  for (const s of services) {
    assert.equal(typeof s.id, "string");
    assert.equal(typeof s.name, "string");
    assert.equal(typeof s.duration, "number");
    assert.equal(typeof s.price, "number");
  }
  assert.ok(staff.every((m) => typeof m.id === "string" && typeof m.name === "string" && typeof m.schedule === "object"), "staff sin id/name/schedule");
  const rules = config.businessRules as Record<string, unknown>;
  assert.equal(typeof rules?.bufferMinutes, "number");
  assert.equal(typeof rules?.maxAdvanceBookingDays, "number");
  assert.equal(typeof rules?.autoConfirm, "boolean");
});

test("2 · config lleva adminEmail normalizado (es lo que deploy.ts propaga a BUSINESS_OWNER_EMAIL)", () => {
  const { config } = buildProvisionDocs(base);
  assert.equal(config.adminEmail, "owner@n08.test");
});

test("3 · el alta pide el bootstrap del dueño en admin_users del tenant", () => {
  const { ownerBootstrap } = buildProvisionDocs(base);
  assert.deepEqual(ownerBootstrap, { email: "owner@n08.test", clientId: base.slug });
  assert.equal(buildProvisionDocs({ ...base, adminEmail: undefined, email: undefined }).ownerBootstrap, null);
});

test("4 · el destinatario del aviso al dueño cae a hub_clients.adminEmail cuando config no lo tiene", () => {
  assert.equal(resolveOwnerNotificationEmail({ adminEmail: "a@x.test" }, { adminEmail: "b@x.test" }), "a@x.test");
  assert.equal(resolveOwnerNotificationEmail({}, { adminEmail: "b@x.test" }), "b@x.test");
  assert.equal(resolveOwnerNotificationEmail({}, {}), undefined);
});

test("5 · lo que ya escribía el alta se conserva (hub_clients, clients, config base)", () => {
  const { hubClient, client, config } = buildProvisionDocs(base);
  assert.equal(hubClient.businessName, "Barbería N08");
  assert.equal(hubClient.status, "demo");
  assert.equal(hubClient.clientId, base.slug);
  assert.equal(hubClient.domain, base.domain);
  assert.deepEqual(client, { status: "active" });
  assert.deepEqual(config.business, { type: "barberia", mode: "team", name: "Barbería N08" });
  assert.equal(config.language, "he");
  assert.equal(typeof config.activeTheme, "string");
});

test("6 · modo solo siembra un solo miembro de personal; employment no siembra catálogo", () => {
  const solo = buildProvisionDocs({ ...base, mode: "solo" });
  assert.equal((solo.config.staff as unknown[]).length, 1);
  const emp = buildProvisionDocs({ ...base, niche: "employment" });
  assert.equal(emp.config.services, undefined);
  assert.equal(emp.config.staff, undefined);
});

// G1.2 — igualdad del catálogo sembrado con los presets *.he.ts del template (por id/duración/precio y nombre).
// Sólo corre si el checkout del template está al lado (misma máquina de Liam); si no, se declara omitida.
const TEMPLATE_PRESETS = "C:/Users/liama/Desktop/Nichos/Barber-shop-template-main/src/config/presets";
test("7 · el catálogo sembrado coincide con los presets he del template (id, duración, precio, nombre)", { skip: !existsSync(TEMPLATE_PRESETS) && "template no disponible en esta máquina" }, () => {
  for (const niche of ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones"] as const) {
    const src = readFileSync(`${TEMPLATE_PRESETS}/${niche}.he.ts`, "utf8");
    const block = src.slice(src.indexOf("\n  services: ["), src.indexOf("\n  ],", src.indexOf("\n  services: [")));
    // Un bloque por servicio ("    {" …), campos por regex independiente: el orden de claves varía por nicho.
    const expected = block.split(/\n    \{/).slice(1).map((chunk) => {
      const pick = (re: RegExp) => chunk.match(re)?.[1];
      return { id: pick(/\bid: "([^"]+)"/), name: pick(/\bname: "([^"]+)"/), duration: Number(pick(/\bduration: (\d+)/)), price: Number(pick(/\bprice: (\d+)/)) };
    });
    const seeded = (buildProvisionDocs({ ...base, niche }).config.services as Array<Record<string, unknown>>)
      .map((s) => ({ id: s.id, name: s.name, duration: s.duration, price: s.price }));
    assert.ok(expected.length > 0, `${niche}: no pude leer el preset`);
    assert.deepEqual(seeded, expected, `${niche}: catálogo sembrado ≠ preset del template`);
  }
});
