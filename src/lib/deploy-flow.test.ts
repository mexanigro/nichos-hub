/**
 * N08 T1b — contrato del alta en Vercel (n08-apertura-v1).
 * RED antes del cambio: el alta seguía tras un 400 en las variables, disparaba el deployment y quedaba «building»
 * (medido en runtime el 2026-09-12: demo-n08-barber-a-prueba-9492f161 sin ninguna variable, deployment READY, API 503).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { runVercelProvision, type VercelFetch } from "./deploy-flow.ts";

type Call = { path: string; method: string; body: unknown };

function fakeVercel(overrides: Partial<Record<"create" | "env" | "domain" | "deploy", { status: number; body?: unknown }>> = {}) {
  const calls: Call[] = [];
  const respond = (status: number, body: unknown) => new Response(JSON.stringify(body ?? {}), { status, headers: { "content-type": "application/json" } });
  const fetchVercel: VercelFetch = async (path, init) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ path, method: init?.method ?? "GET", body });
    if (path.startsWith("/v1/projects")) return respond(overrides.create?.status ?? 200, overrides.create?.body ?? { id: "prj_test" });
    if (/\/projects\/prj_test\/env/.test(path)) return respond(overrides.env?.status ?? 201, overrides.env?.body ?? { created: [] });
    if (/\/projects\/prj_test\/domains/.test(path)) return respond(overrides.domain?.status ?? 200, overrides.domain?.body ?? { name: "x" });
    if (path.startsWith("/v13/deployments")) return respond(overrides.deploy?.status ?? 200, overrides.deploy?.body ?? { id: "dpl_test" });
    return respond(404, { error: "unexpected" });
  };
  return { fetchVercel, calls };
}

const base = {
  clientId: "demo-n08-test",
  projectName: "demo-n08-test",
  templateRepo: "mexanigro/Barber-shop-template",
  domain: "demo-n08-test.arzac.studio",
  envVars: [
    { key: "VITE_CLIENT_ID", value: "demo-n08-test", target: ["production", "preview"], type: "plain" },
    { key: "FIREBASE_ADMIN_PRIVATE_KEY", value: "-----BEGIN PRIVATE KEY-----\nsecreto\n-----END PRIVATE KEY-----", target: ["production", "preview"], type: "sensitive" },
  ],
};

function hubRecorder() {
  const writes: Array<Record<string, unknown>> = [];
  return { writes, updateHub: async (f: Record<string, unknown>) => { writes.push(f); } };
}

test("1 · Vercel rechaza las variables (400) → el alta falla cerrado: deployStatus error, deployError sin valores, vercelProjectId conservado, y NO se dispara el deployment", async () => {
  const v = fakeVercel({ env: { status: 400, body: { error: { code: "bad_request", message: "Invalid type sensitive", key: "FIREBASE_ADMIN_PRIVATE_KEY" } } } });
  const hub = hubRecorder();
  const r = await runVercelProvision({ ...base, fetchVercel: v.fetchVercel, updateHub: hub.updateHub });
  assert.equal(r.status, "error");
  assert.equal(r.projectId, "prj_test");
  assert.ok(!v.calls.some((c) => c.path.startsWith("/v13/deployments")), "disparó el deployment tras el 400 de variables");
  const last = hub.writes.at(-1) ?? {};
  assert.equal(last.deployStatus, "error");
  assert.equal(last.vercelProjectId, "prj_test");
  assert.match(String(last.deployError), /400/);
  assert.doesNotMatch(String(last.deployError), /secreto/, "deployError filtró el valor de una variable");
});

test("2 · el lote de variables va por v10 con upsert (el tipo sensitive no existe en v3)", async () => {
  const v = fakeVercel();
  const hub = hubRecorder();
  await runVercelProvision({ ...base, fetchVercel: v.fetchVercel, updateHub: hub.updateHub });
  const env = v.calls.find((c) => /\/projects\/prj_test\/env/.test(c.path));
  assert.ok(env, "sin POST de variables");
  assert.match(env.path, /^\/v10\/projects\/prj_test\/env\?upsert=true$/);
  assert.equal(env.method, "POST");
  assert.equal((env.body as unknown[]).length, 2);
});

test("3 · v10 responde 201 pero con failedKeys → también falla cerrado", async () => {
  const v = fakeVercel({ env: { status: 201, body: { created: [{ key: "VITE_CLIENT_ID" }], failed: [{ error: { code: "invalid", key: "FIREBASE_ADMIN_PRIVATE_KEY" } }] } } });
  const hub = hubRecorder();
  const r = await runVercelProvision({ ...base, fetchVercel: v.fetchVercel, updateHub: hub.updateHub });
  assert.equal(r.status, "error");
  assert.match(String((hub.writes.at(-1) ?? {}).deployError), /FIREBASE_ADMIN_PRIVATE_KEY/);
  assert.ok(!v.calls.some((c) => c.path.startsWith("/v13/deployments")));
});

test("4 · el dominio falla → falla cerrado antes del deployment", async () => {
  const v = fakeVercel({ domain: { status: 409, body: { error: { code: "domain_taken" } } } });
  const hub = hubRecorder();
  const r = await runVercelProvision({ ...base, fetchVercel: v.fetchVercel, updateHub: hub.updateHub });
  assert.equal(r.status, "error");
  assert.ok(!v.calls.some((c) => c.path.startsWith("/v13/deployments")));
  assert.equal((hub.writes.at(-1) ?? {}).deployStatus, "error");
});

test("5 · camino feliz: proyecto → variables → dominio → deployment, en ese orden; building con deploymentId", async () => {
  const v = fakeVercel();
  const hub = hubRecorder();
  const r = await runVercelProvision({ ...base, fetchVercel: v.fetchVercel, updateHub: hub.updateHub });
  assert.equal(r.status, "building");
  assert.equal(r.status === "building" && r.deploymentId, "dpl_test");
  const order = v.calls.map((c) => c.path.replace(/\?.*$/, ""));
  assert.deepEqual(order, ["/v1/projects", "/v10/projects/prj_test/env", "/v9/projects/prj_test/domains", "/v13/deployments"]);
  const last = hub.writes.at(-1) ?? {};
  assert.equal(last.deployStatus, "building");
  assert.equal(last.vercelProjectId, "prj_test");
});

test("6 · el trigger del deployment falla → error registrado (no «building» ficticio)", async () => {
  const v = fakeVercel({ deploy: { status: 500, body: { error: "boom" } } });
  const hub = hubRecorder();
  const r = await runVercelProvision({ ...base, fetchVercel: v.fetchVercel, updateHub: hub.updateHub });
  assert.equal(r.status, "error");
  assert.equal((hub.writes.at(-1) ?? {}).deployStatus, "error");
});
