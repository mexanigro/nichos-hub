import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CoreContactAdapterError, type CoreContactCreate } from "./core-contact-adapter.ts";
import {
  CORE_CONTACT_ENTRY_POINTS,
  importCustomerContacts,
  readContactSummary,
  recordBookedContact,
  type CoreContactShellAdapter,
} from "./core-contact-shell.ts";

function shellAdapter(overrides: Partial<CoreContactShellAdapter> = {}): CoreContactShellAdapter {
  return {
    assertScope: () => undefined,
    create: async () => ({ key: "contact-local-0001", revision: 1, recovered: false }),
    summary: async () => ({ active: 2, archived: 1, total: 3, coverage: "all-allowlisted-sources" }),
    ...overrides,
  };
}

test("la importación H construye comandos estables por importación y fila", async () => {
  const commands: CoreContactCreate[] = [];
  const adapter = shellAdapter({
    create: async (command) => {
      commands.push(command);
      return { key: `contact-${commands.length}`, revision: 1, recovered: false };
    },
  });
  const input = {
    adapter,
    clientId: "tenant-h-local",
    importId: "import-local-000001",
    rows: [
      { fullName: " נועם כהן ", email: " NOAM@EXAMPLE.COM ", phone: " +972501234567 ", tags: "חדש, VIP", notes: " הערה " },
      { fullName: "" },
    ],
  };

  const first = await importCustomerContacts(input);
  const second = await importCustomerContacts(input);
  assert.deepEqual(first, { imported: 1, rejected: 1, errors: ["Fila 2: fullName requerido"], total: 2 });
  assert.deepEqual(second, first);
  assert.equal(commands.length, 2);
  assert.deepEqual(commands[1], commands[0]);
  assert.deepEqual(commands[0], {
    operationId: "hub-import-import-local-000001-1",
    clientId: "tenant-h-local",
    entryPoint: CORE_CONTACT_ENTRY_POINTS.import,
    fields: {
      fullName: "נועם כהן",
      email: "noam@example.com",
      phone: "+972501234567",
      channel: "import",
      notes: "הערה",
      tags: ["חדש", "VIP"],
    },
  });
});

test("el shell H rechaza scope antes de entregar una fila al adaptador", async () => {
  let creates = 0;
  const adapter = shellAdapter({
    assertScope: () => { throw new CoreContactAdapterError(403, "contact_adapter_scope"); },
    create: async () => { creates++; return { key: "forbidden", revision: 1, recovered: false }; },
  });
  await assert.rejects(
    () => importCustomerContacts({ adapter, clientId: "tenant-ajeno", importId: "import-local-000002", rows: [{ fullName: "No escribir" }] }),
    (error: unknown) => error instanceof CoreContactAdapterError && error.status === 403,
  );
  assert.equal(creates, 0);
});

test("la reserva H conserva operación y distingue confirmado, rechazo e incertidumbre", async () => {
  const command: CoreContactCreate[] = [];
  const base = {
    clientId: "tenant-h-local",
    appointmentId: "appointment-local-0001",
    customerName: "דנה לוי",
    customerEmail: "wa_972501234567@whatsapp.local",
    customerPhone: "+972501234567",
  };
  const confirmed = await recordBookedContact({
    ...base,
    adapter: shellAdapter({ create: async (value) => { command.push(value); return { key: "contact-book-0001", revision: 1, recovered: true }; } }),
  });
  assert.deepEqual(confirmed, { state: "confirmed", operationId: "hub-book-contact-appointment-local-0001", key: "contact-book-0001", revision: 1 });
  assert.equal(command[0].entryPoint, CORE_CONTACT_ENTRY_POINTS.book);

  const rejected = await recordBookedContact({ ...base, adapter: shellAdapter({ create: async () => { throw new CoreContactAdapterError(422, "contact_field_invalid"); } }) });
  assert.deepEqual(rejected, { state: "rejected", operationId: confirmed.operationId, error: "contact_field_invalid" });
  const uncertain = await recordBookedContact({ ...base, adapter: shellAdapter({ create: async () => { throw new CoreContactAdapterError(503, "contact_recovery_pending", true); } }) });
  assert.deepEqual(uncertain, { state: "uncertain", operationId: confirmed.operationId, error: "contact_recovery_pending" });
});

test("las cifras H usan sólo el scope y la proyección agregada del Core", async () => {
  const scopes: string[] = [];
  const adapter = shellAdapter({ assertScope: (_clientId, entryPoint) => scopes.push(entryPoint) });
  assert.deepEqual(await readContactSummary(adapter, "tenant-h-local"), { active: 2, archived: 1, total: 3, coverage: "all-allowlisted-sources" });
  assert.deepEqual(scopes, [CORE_CONTACT_ENTRY_POINTS.stats]);
});

test("las entradas y consumidores reales del shell H quedan enlazados al contrato común", async () => {
  const [importRoute, bookRoute, statsRoute, modal, page] = await Promise.all([
    readFile(new URL("../app/api/crm/import/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/appointments/book/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/crm-stats/[clientId]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/crm-import-modal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/clients/[clientId]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(importRoute, /importCustomerContacts\s*\(/);
  assert.match(bookRoute, /recordBookedContact\s*\(/);
  assert.match(statsRoute, /readContactSummary\s*\(/);
  assert.match(modal, /importIdRef\.current\s*\?\?/);
  assert.match(modal, /fetch\("\/api\/crm\/import"/);
  assert.match(page, /fetch\(`\/api\/crm-stats\/\$\{clientId\}`\)/);
  assert.match(page, /<CrmImportModal clientId=\{client\.clientId\}/);
});
