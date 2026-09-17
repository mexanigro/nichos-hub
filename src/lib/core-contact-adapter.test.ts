import test from "node:test";
import assert from "node:assert/strict";
import { CoreContactAdapterError, createCoreContactAdapter, type CoreContactCreate } from "./core-contact-adapter.ts";

const tenant = "tenant-bp2-local";
const entryPoint = "hub-import-contacts";
const command: CoreContactCreate = {
  operationId: "hub-import-local-0001-1",
  clientId: tenant,
  entryPoint,
  fields: { fullName: "נועם כהן", email: null, phone: "+972 50-123-4567", channel: "import", notes: "הערה", tags: ["חדש"] },
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "X-Contact-Tenant": tenant, "X-Contact-Issuer": "hub-local", "X-Contact-Uid": "hub-service" },
  });
}

function adapter(request: typeof fetch) {
  return createCoreContactAdapter({
    baseUrl: "http://127.0.0.1:49152",
    credential: "fixture-secret",
    issuer: "hub-local",
    uid: "hub-service",
    tenants: new Set([tenant]),
    entryPoints: new Set([entryPoint, "hub-crm-stats"]),
    request,
  });
}

test("rechaza tenant fuera del catálogo antes del primer fetch", async () => {
  let calls = 0;
  const client = adapter((async () => { calls++; return response({}); }) as typeof fetch);
  await assert.rejects(() => client.create({ ...command, clientId: "tenant-ajeno" }), (error: unknown) => error instanceof CoreContactAdapterError && error.status === 403);
  assert.equal(calls, 0);
});

test("envía un comando cerrado y conserva la atribución de servicio", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = adapter((async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return response({ key: "c2_fixture", revision: 1 });
  }) as typeof fetch);
  assert.deepEqual(await client.create(command), { key: "c2_fixture", revision: 1, recovered: false });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { operationId: command.operationId, action: "create", fields: command.fields, entryPoint });
  assert.equal((calls[0].init?.headers as Record<string, string>)["X-Contact-Tenant"], tenant);
});

test("una respuesta POST perdida consulta el mismo ID y no emite otro POST", async () => {
  const methods: string[] = [];
  const urls: string[] = [];
  const client = adapter((async (url: string | URL | Request, init?: RequestInit) => {
    methods.push(String(init?.method)); urls.push(String(url));
    if (methods.length === 1) throw new TypeError("respuesta suprimida");
    return response({ key: "c2_recovered", revision: 1 });
  }) as typeof fetch);
  assert.deepEqual(await client.create(command), { key: "c2_recovered", revision: 1, recovered: true });
  assert.deepEqual(methods, ["POST", "GET"]);
  assert.match(urls[1], new RegExp(command.operationId + "$"));
});

test("un 422 es rechazo confirmado y no dispara recuperación", async () => {
  let calls = 0;
  const client = adapter((async () => { calls++; return response({ error: "contact_field_invalid" }, 422); }) as typeof fetch);
  await assert.rejects(() => client.create(command), (error: unknown) => error instanceof CoreContactAdapterError && error.status === 422 && !error.uncertain);
  assert.equal(calls, 1);
});

test("las cifras consumen sólo la proyección agregada del núcleo", async () => {
  const client = adapter((async (_url: string | URL | Request, init?: RequestInit) => {
    assert.equal(init?.method, "GET");
    return response({ active: 7, archived: 2, total: 9, coverage: "all-allowlisted-sources" });
  }) as typeof fetch);
  assert.deepEqual(await client.summary(tenant, "hub-crm-stats"), { active: 7, archived: 2, total: 9, coverage: "all-allowlisted-sources" });
});
