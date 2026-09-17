import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { importCustomerContacts, type CustomerImportRow } from "./core-contact-shell.ts";

// C4-2 (BP2-01): el modal no ofrece columnas de cliente que el shell descarta en silencio,
// y el shell no recibe visitas ni pago como parte de un contacto.
test("las opciones de cliente del modal de importación no ofrecen visitas ni método de pago", async () => {
  const modal = await readFile(new URL("../components/crm-import-modal.tsx", import.meta.url), "utf8");
  const customerBlock = modal.slice(modal.indexOf("const CUSTOMER_FIELDS"), modal.indexOf("const APPOINTMENT_FIELDS"));
  const offered = [...customerBlock.matchAll(/value: "([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
  assert.deepEqual(offered, ["fullName", "email", "phone", "tags", "notes"]);
  const labels = [...customerBlock.matchAll(/label: "([^"]*)"/g)].map((m) => m[1]);
  assert.ok(!labels.includes("Cant. visitas") && !labels.includes("Metodo de pago"));
});

test("la ruta de importación no declara visitas ni pago en la fila de cliente", async () => {
  const route = await readFile(new URL("../app/api/crm/import/route.ts", import.meta.url), "utf8");
  const customerRow = route.slice(route.indexOf("interface CustomerRow"), route.indexOf("interface AppointmentRow"));
  const declared = [...customerRow.matchAll(/^\s+(\w+)\??:/gm)].map((m) => m[1]);
  assert.deepEqual(declared, ["source"]);
});

test("el shell H sólo entrega al Core los campos de contacto, aunque la fila traiga visitas o pago", async () => {
  const fields: Record<string, unknown>[] = [];
  const row = { fullName: "Ana", visitCount: 7, paymentMethod: "cash" } as CustomerImportRow & Record<string, unknown>;
  await importCustomerContacts({
    adapter: {
      assertScope: () => undefined,
      create: async (command) => { fields.push(command.fields as Record<string, unknown>); return { key: "k", revision: 1, recovered: false }; },
      summary: async () => ({ active: 0, archived: 0, total: 0, coverage: "all-allowlisted-sources" }),
    },
    clientId: "tenant-h-local",
    importId: "import-local-000002",
    rows: [row],
  });
  assert.equal(fields.length, 1);
  assert.deepEqual(Object.keys(fields[0]).sort(), ["channel", "email", "fullName", "notes", "phone", "tags"]);
});
