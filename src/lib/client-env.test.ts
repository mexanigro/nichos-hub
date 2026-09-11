/**
 * Contrato R06-ENV (r06-env-v1): el hub propaga la credencial Admin de
 * barbertemplate-madre a cada proyecto Vercel de cliente, y reprovisiona los
 * existentes con upsert + redeploy.
 *
 * Sin red: `fetchVercel` se inyecta. Ningun valor real: todo son marcadores.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildAdminEnvVars, reprovisionAndRedeploy, PROTECTED_PROJECT_IDS } from "./client-env.ts";

const HUB_ENV = {
  FIREBASE_PROJECT_ID: "proj-marker",
  FIREBASE_CLIENT_EMAIL: "email-marker",
  FIREBASE_PRIVATE_KEY: "key-marker",
  FIREBASE_DATABASE_ID: "db-marker",
};

test("buildAdminEnvVars: las cuatro variables, tipos y targets exactos", () => {
  const vars = buildAdminEnvVars(HUB_ENV);
  const byKey = Object.fromEntries(vars.map((v) => [v.key, v]));
  for (const key of ["FIREBASE_PROJECT_ID", "FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY"]) {
    assert.ok(byKey[key], `falta ${key}`);
    assert.deepEqual(byKey[key].target, ["production", "preview"], `${key}: target`);
  }
  assert.equal(byKey.FIREBASE_PROJECT_ID.type, "plain");
  assert.equal(byKey.FIREBASE_ADMIN_PROJECT_ID.type, "plain");
  assert.equal(byKey.FIREBASE_ADMIN_CLIENT_EMAIL.type, "plain");
  // M1: la clave privada NUNCA viaja en claro (doc oficial 2026-09-11: plain | encrypted | sensitive | system)
  assert.equal(byKey.FIREBASE_ADMIN_PRIVATE_KEY.type, "sensitive");
  assert.equal(byKey.FIREBASE_PROJECT_ID.value, "proj-marker");
  assert.equal(byKey.FIREBASE_ADMIN_PROJECT_ID.value, "proj-marker");
  assert.equal(byKey.FIREBASE_ADMIN_CLIENT_EMAIL.value, "email-marker");
  assert.equal(byKey.FIREBASE_ADMIN_PRIVATE_KEY.value, "key-marker");
});

test("buildAdminEnvVars: la clave privada viaja normalizada como la consume el hub (sin comillas, saltos reales)", () => {
  const raw = '"-----BEGIN PRIVATE KEY-----\\nMARKER\\n-----END PRIVATE KEY-----\\n"';
  const expected = "-----BEGIN PRIVATE KEY-----\nMARKER\n-----END PRIVATE KEY-----";
  const key = buildAdminEnvVars({ ...HUB_ENV, FIREBASE_PRIVATE_KEY: raw }).find((v) => v.key === "FIREBASE_ADMIN_PRIVATE_KEY")!;
  assert.equal(key.value, expected);
  // ya normalizada: idempotente
  const again = buildAdminEnvVars({ ...HUB_ENV, FIREBASE_PRIVATE_KEY: key.value }).find((v) => v.key === "FIREBASE_ADMIN_PRIVATE_KEY")!;
  assert.equal(again.value, expected);
});

test("buildAdminEnvVars: FIREBASE_DATABASE_ID viaja (plain) solo si el hub la tiene", () => {
  const con = buildAdminEnvVars(HUB_ENV).find((v) => v.key === "FIREBASE_DATABASE_ID");
  assert.ok(con);
  assert.equal(con.type, "plain");
  assert.equal(con.value, "db-marker");
  const sin = buildAdminEnvVars({ ...HUB_ENV, FIREBASE_DATABASE_ID: undefined });
  assert.equal(sin.find((v) => v.key === "FIREBASE_DATABASE_ID"), undefined);
});

test("buildAdminEnvVars: falla cerrado si el hub no tiene la credencial", () => {
  assert.throws(() => buildAdminEnvVars({ ...HUB_ENV, FIREBASE_PRIVATE_KEY: undefined }), /FIREBASE_PRIVATE_KEY/);
  assert.throws(() => buildAdminEnvVars({ ...HUB_ENV, FIREBASE_CLIENT_EMAIL: "  " }), /FIREBASE_CLIENT_EMAIL/);
});

type Call = { path: string; method?: string; body?: string };
function fakeFetch(plan: Array<{ status: number; json: unknown }>) {
  const calls: Call[] = [];
  const fetchVercel = async (path: string, options: RequestInit = {}) => {
    calls.push({ path, method: options.method, body: typeof options.body === "string" ? options.body : undefined });
    const next = plan.shift() ?? { status: 500, json: {} };
    return new Response(JSON.stringify(next.json), { status: next.status, headers: { "Content-Type": "application/json" } });
  };
  return { calls, fetchVercel };
}

const TARGET = { projectId: "prj_test", projectName: "demo-test", templateRepo: "mexanigro/Barber-shop-template" };

test("reprovision: upsert=true en v10 y despues redeploy por API con gitSource main", async () => {
  const { calls, fetchVercel } = fakeFetch([
    { status: 201, json: { created: [], failed: [] } },
    { status: 200, json: { id: "dpl_new" } },
  ]);
  const result = await reprovisionAndRedeploy({ ...TARGET, env: HUB_ENV, fetchVercel });
  assert.equal(calls.length, 2);
  assert.match(calls[0].path, /^\/v10\/projects\/prj_test\/env\?upsert=true$/);
  assert.equal(calls[0].method, "POST");
  const sent = JSON.parse(calls[0].body!) as Array<{ key: string; type: string }>;
  assert.deepEqual(sent.map((v) => v.key).sort(), ["FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY", "FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_DATABASE_ID", "FIREBASE_PROJECT_ID"]);
  assert.equal(calls[1].path, "/v13/deployments");
  const dep = JSON.parse(calls[1].body!);
  assert.deepEqual(dep.gitSource, { type: "github", org: "mexanigro", repo: "Barber-shop-template", ref: "main" });
  assert.equal(dep.project, "prj_test");
  assert.equal(dep.target, "production");
  assert.equal(result.ok, true);
  assert.equal(result.deploymentId, "dpl_new");
});

test("reprovision (M2): sin upsert OK no hay redeploy — HTTP no-ok", async () => {
  const { calls, fetchVercel } = fakeFetch([{ status: 400, json: { error: { code: "bad" } } }]);
  const result = await reprovisionAndRedeploy({ ...TARGET, env: HUB_ENV, fetchVercel });
  assert.equal(calls.length, 1, "no debe llamar a /v13/deployments");
  assert.equal(result.ok, false);
  assert.equal(result.stage, "upsert");
});

test("reprovision (M2): sin upsert OK no hay redeploy — 'failed' no vacio", async () => {
  const { calls, fetchVercel } = fakeFetch([
    { status: 201, json: { created: [], failed: [{ error: { key: "FIREBASE_ADMIN_PRIVATE_KEY", code: "x" } }] } },
  ]);
  const result = await reprovisionAndRedeploy({ ...TARGET, env: HUB_ENV, fetchVercel });
  assert.equal(calls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.stage, "upsert");
  assert.deepEqual(result.failedKeys, ["FIREBASE_ADMIN_PRIVATE_KEY"]);
});

test("reprovision: proyecto Vercel inexistente -> upsert 404, sin redeploy, status expuesto", async () => {
  const { calls, fetchVercel } = fakeFetch([{ status: 404, json: { error: { code: "not_found" } } }]);
  const result = await reprovisionAndRedeploy({ ...TARGET, env: HUB_ENV, fetchVercel });
  assert.equal(calls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.stage, "upsert");
  assert.equal(result.status, 404);
});

test("reprovision: el resultado nunca contiene valores de variables", async () => {
  const { fetchVercel } = fakeFetch([
    { status: 201, json: { created: [{ key: "FIREBASE_ADMIN_PRIVATE_KEY", value: "key-marker" }], failed: [] } },
    { status: 200, json: { id: "dpl_new" } },
  ]);
  const result = await reprovisionAndRedeploy({ ...TARGET, env: HUB_ENV, fetchVercel });
  const serialized = JSON.stringify(result);
  for (const marker of ["proj-marker", "email-marker", "key-marker", "db-marker"]) {
    assert.ok(!serialized.includes(marker), `el resultado filtra ${marker}`);
  }
});

test("madre queda protegida: su proyecto Vercel esta en la lista de excluidos", () => {
  assert.ok(PROTECTED_PROJECT_IDS.includes("prj_WPbUEboAIbVn9Z9Wazukaa9oV0pA"));
});

// Guard sobre el cableado (los route handlers no se importan bajo node:test).
const HERE = fileURLToPath(new URL("./", import.meta.url));
const read = (rel: string) => readFileSync(new URL(rel, `file:///${HERE.replace(/\\/g, "/")}`), "utf8");

test("deploy.ts usa buildAdminEnvVars al crear un proyecto", () => {
  const src = read("./deploy.ts");
  assert.ok(src.includes("buildAdminEnvVars("), "deploy.ts debe propagar la credencial Admin");
});

test("la ruta de reprovisionado exige owner, usa el modulo y no loggea valores", () => {
  const src = read("../app/api/clients/reprovision/route.ts");
  assert.ok(src.includes("withOwner("), "withOwner");
  assert.ok(src.includes("reprovisionAndRedeploy("), "usa reprovisionAndRedeploy");
  assert.ok(src.includes("PROTECTED_PROJECT_IDS"), "excluye madre");
  assert.ok(/no tiene un proyecto en Vercel[^]*status: 400/.test(src), "400 sin vercelProjectId");
  assert.ok(/Cliente no encontrado[^]*status: 404/.test(src), "404 doc inexistente");
  assert.ok(/status === 404[^]*status: 404|stage[^]*404/.test(src), "404 de Vercel se propaga como 404");
  assert.ok(!/console\.(log|error|warn)\([^)]*(env|value|PRIVATE)/i.test(src), "no loggea valores");
});
