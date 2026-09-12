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

test("buildAdminEnvVars: las cuatro variables Admin, tipos y targets exactos", () => {
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

// N08 T1c (NC-12): api/index.ts:227 lee SOLO FIREBASE_SERVICE_ACCOUNT_EMAIL/KEY para su REST
// (admin_users, /api/contact, sitemap, /api/services...). Mismos valores que las Admin.
test("T1c-1 · buildAdminEnvVars: las dos del camino REST del template, con los mismos valores que las Admin", () => {
  const byKey = Object.fromEntries(buildAdminEnvVars(HUB_ENV).map((v) => [v.key, v]));
  assert.ok(byKey.FIREBASE_SERVICE_ACCOUNT_EMAIL, "falta FIREBASE_SERVICE_ACCOUNT_EMAIL");
  assert.ok(byKey.FIREBASE_SERVICE_ACCOUNT_KEY, "falta FIREBASE_SERVICE_ACCOUNT_KEY");
  assert.equal(byKey.FIREBASE_SERVICE_ACCOUNT_EMAIL.type, "plain");
  assert.equal(byKey.FIREBASE_SERVICE_ACCOUNT_KEY.type, "sensitive");
  assert.deepEqual(byKey.FIREBASE_SERVICE_ACCOUNT_EMAIL.target, ["production", "preview"]);
  assert.deepEqual(byKey.FIREBASE_SERVICE_ACCOUNT_KEY.target, ["production", "preview"]);
  assert.equal(byKey.FIREBASE_SERVICE_ACCOUNT_EMAIL.value, byKey.FIREBASE_ADMIN_CLIENT_EMAIL.value);
  assert.equal(byKey.FIREBASE_SERVICE_ACCOUNT_KEY.value, byKey.FIREBASE_ADMIN_PRIVATE_KEY.value);
  // la clave llega normalizada (saltos reales): el template solo hace replace(/\\n/g, "\n")
  const raw = '"-----BEGIN PRIVATE KEY-----\\nMARKER\\n-----END PRIVATE KEY-----\\n"';
  const k = buildAdminEnvVars({ ...HUB_ENV, FIREBASE_PRIVATE_KEY: raw }).find((v) => v.key === "FIREBASE_SERVICE_ACCOUNT_KEY")!;
  assert.equal(k.value, "-----BEGIN PRIVATE KEY-----\nMARKER\n-----END PRIVATE KEY-----");
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
  assert.deepEqual(sent.map((v) => v.key).sort(), ["FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY", "FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_DATABASE_ID", "FIREBASE_PROJECT_ID", "FIREBASE_SERVICE_ACCOUNT_EMAIL", "FIREBASE_SERVICE_ACCOUNT_KEY"]);
  assert.equal(calls[1].path, "/v13/deployments");
  const dep = JSON.parse(calls[1].body!);
  assert.deepEqual(dep.gitSource, { type: "github", org: "mexanigro", repo: "Barber-shop-template", ref: "main" });
  assert.equal(dep.project, "prj_test");
  assert.equal(dep.target, "production");
  assert.equal(result.ok, true);
  assert.equal(result.deploymentId, "dpl_new");
});

test("T1c-2 · reprovision: extraVars (BUSINESS_OWNER_EMAIL) viajan en el mismo upsert y figuran en keys", async () => {
  const { calls, fetchVercel } = fakeFetch([
    { status: 201, json: { created: [], failed: [] } },
    { status: 200, json: { id: "dpl_new" } },
  ]);
  const extra = [{ key: "BUSINESS_OWNER_EMAIL", value: "owner-marker", target: ["production", "preview"], type: "plain" as const }];
  const result = await reprovisionAndRedeploy({ ...TARGET, env: HUB_ENV, fetchVercel, extraVars: extra });
  assert.equal(calls.length, 2);
  const sent = JSON.parse(calls[0].body!) as Array<{ key: string; value: string; type: string }>;
  const owner = sent.find((v) => v.key === "BUSINESS_OWNER_EMAIL");
  assert.ok(owner, "BUSINESS_OWNER_EMAIL no viajo en el upsert");
  assert.equal(owner.value, "owner-marker");
  assert.equal(owner.type, "plain");
  assert.ok(result.keys.includes("BUSINESS_OWNER_EMAIL"), "keys no lista BUSINESS_OWNER_EMAIL");
  assert.ok(!JSON.stringify(result).includes("owner-marker"), "el resultado filtra el valor");
  // sin extraVars: comportamiento de siempre
  const plain = fakeFetch([{ status: 201, json: { created: [], failed: [] } }, { status: 200, json: { id: "dpl_2" } }]);
  await reprovisionAndRedeploy({ ...TARGET, env: HUB_ENV, fetchVercel: plain.fetchVercel });
  assert.ok(!JSON.parse(plain.calls[0].body!).some((v: { key: string }) => v.key === "BUSINESS_OWNER_EMAIL"));
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

test("T1c-3 · la ruta de reprovisionado resuelve BUSINESS_OWNER_EMAIL (config.adminEmail → hub_clients.adminEmail) y lo pasa como extraVars", () => {
  const src = read("../app/api/clients/reprovision/route.ts");
  assert.ok(src.includes("resolveOwnerNotificationEmail("), "usa resolveOwnerNotificationEmail");
  assert.ok(/collection\("config"\)\.doc\(/.test(src), "lee config/{clientId}");
  assert.ok(/extraVars/.test(src), "pasa extraVars a reprovisionAndRedeploy");
  assert.ok(/BUSINESS_OWNER_EMAIL/.test(src), "la clave es BUSINESS_OWNER_EMAIL");
  // sin destinatario resuelto no se inventa uno
  assert.ok(!/BUSINESS_OWNER_EMAIL[^\n]*\|\|\s*["']/.test(src), "no hay fallback literal de destinatario");
});
