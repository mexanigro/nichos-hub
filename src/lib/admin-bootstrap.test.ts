/**
 * Contrato n05-persona-owner-v1: bootstrap del dueño en admin_users de un
 * tenant + claims (clientId, tenantRole=owner) + revocación, reutilizando la
 * lógica de tenant-claim. db y auth inyectados; sin red, sin valores reales.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { bootstrapTenantOwner } from "./admin-bootstrap.ts";

type Doc = { exists: boolean; data(): Record<string, unknown> | undefined };

function fakes(existing: Record<string, Record<string, unknown>> = {}, authUsers: Record<string, { uid: string; customClaims?: Record<string, unknown> }> = {}) {
  const calls: string[] = [];
  const writes: Array<{ id: string; data: Record<string, unknown> }> = [];
  const db = {
    collection(name: string) {
      assert.equal(name, "admin_users");
      return {
        doc(id: string) {
          return {
            async get(): Promise<Doc> {
              calls.push(`get:${id}`);
              const d = existing[id];
              return { exists: !!d, data: () => d };
            },
            async set(data: Record<string, unknown>) {
              calls.push(`set:${id}`);
              writes.push({ id, data });
            },
          };
        },
      };
    },
  };
  const claims: Record<string, Record<string, unknown>> = {};
  const auth = {
    async getUserByEmail(email: string) {
      calls.push(`getUser:${email}`);
      const u = authUsers[email];
      if (!u) throw new Error("auth/user-not-found");
      return { uid: u.uid, email, customClaims: u.customClaims };
    },
    async setCustomUserClaims(uid: string, c: Record<string, unknown>) {
      calls.push(`claims:${uid}`);
      claims[uid] = c;
    },
    async revokeRefreshTokens(uid: string) {
      calls.push(`revoke:${uid}`);
    },
  };
  return { db, auth, calls, writes, claims };
}

const NOW = new Date("2026-09-11T14:00:00.000Z");
const AUTH = { "liam.arzac@gmail.com": { uid: "uid-liam", customClaims: { foo: "bar" } } };

test("escribe admin_users/{email en minusculas} con los campos exactos y luego claims + revocacion", async () => {
  const f = fakes({}, AUTH);
  const r = await bootstrapTenantOwner({ email: "  Liam.Arzac@Gmail.com ", clientId: "client_barber_01", db: f.db, auth: f.auth, now: NOW });
  assert.equal(r.ok, true);
  assert.equal(r.rosterWritten, true);
  assert.deepEqual(f.writes, [{
    id: "liam.arzac@gmail.com",
    data: { email: "liam.arzac@gmail.com", clientId: "client_barber_01", role: "owner", invitedBy: "system", invitedAt: NOW, status: "active" },
  }]);
  // orden: roster antes que claims; claims preservan las existentes; revocacion despues
  assert.deepEqual(f.calls, ["get:liam.arzac@gmail.com", "set:liam.arzac@gmail.com", "getUser:liam.arzac@gmail.com", "claims:uid-liam", "revoke:uid-liam"]);
  assert.deepEqual(f.claims["uid-liam"], { foo: "bar", clientId: "client_barber_01", tenantRole: "owner" });
  assert.equal(r.claimsSynced, true);
});

test("idempotente: si ya existe con el mismo clientId no reescribe, pero sigue sincronizando claims", async () => {
  const f = fakes({ "liam.arzac@gmail.com": { clientId: "client_barber_01", role: "owner" } }, AUTH);
  const r = await bootstrapTenantOwner({ email: "LIAM.ARZAC@gmail.com", clientId: "client_barber_01", db: f.db, auth: f.auth, now: NOW });
  assert.equal(r.ok, true);
  assert.equal(r.rosterWritten, false);
  assert.equal(f.writes.length, 0);
  assert.ok(f.calls.includes("claims:uid-liam") && f.calls.includes("revoke:uid-liam"));
});

test("409 si el email ya es admin de OTRO tenant: no escribe ni toca claims", async () => {
  const f = fakes({ "liam.arzac@gmail.com": { clientId: "demo-otro", role: "owner" } }, AUTH);
  const r = await bootstrapTenantOwner({ email: "liam.arzac@gmail.com", clientId: "client_barber_01", db: f.db, auth: f.auth, now: NOW });
  assert.equal(r.ok, false);
  assert.equal(r.status, 409);
  assert.match(r.error, /demo-otro/);
  assert.equal(f.writes.length, 0);
  assert.ok(!f.calls.some((c) => c.startsWith("claims:") || c.startsWith("revoke:")));
});

test("usuario ausente en Auth: el roster se escribe y las claims quedan pendientes con motivo", async () => {
  const f = fakes({}, {});
  const r = await bootstrapTenantOwner({ email: "nuevo@example.com", clientId: "client_barber_01", db: f.db, auth: f.auth, now: NOW });
  assert.equal(r.ok, true);
  assert.equal(r.rosterWritten, true);
  assert.equal(r.claimsSynced, false);
  assert.equal(r.claimsReason, "user_not_found");
});

test("entrada invalida: email vacio o clientId vacio -> 400 sin tocar nada", async () => {
  const f = fakes({}, AUTH);
  const a = await bootstrapTenantOwner({ email: "   ", clientId: "client_barber_01", db: f.db, auth: f.auth, now: NOW });
  const b = await bootstrapTenantOwner({ email: "liam.arzac@gmail.com", clientId: "", db: f.db, auth: f.auth, now: NOW });
  assert.equal(a.ok, false); assert.equal(a.status, 400);
  assert.equal(b.ok, false); assert.equal(b.status, 400);
  assert.equal(f.calls.length, 0);
});

// Guards de cableado (los route handlers no se importan bajo node:test).
const HERE = fileURLToPath(new URL("./", import.meta.url));
const read = (rel: string) => readFileSync(new URL(rel, `file:///${HERE.replace(/\\/g, "/")}`), "utf8");

test("la logica de claims vive en tenant-claim.ts y la ruta /api/tenant-claim la reutiliza (no la copia)", () => {
  const lib = read("./tenant-claim.ts");
  assert.ok(lib.includes("setCustomUserClaims(") && lib.includes("revokeRefreshTokens("));
  const route = read("../app/api/tenant-claim/route.ts");
  assert.ok(route.includes("setTenantOwnerClaim("), "la ruta usa la funcion compartida");
  assert.ok(!route.includes("setCustomUserClaims("), "la ruta ya no duplica la logica");
  const boot = read("./admin-bootstrap.ts");
  assert.ok(boot.includes("setTenantOwnerClaim("), "el bootstrap reutiliza la misma funcion");
});

test("la ruta admin-bootstrap exige owner, usa el modulo y no loggea valores", () => {
  const src = read("../app/api/clients/[clientId]/admin-bootstrap/route.ts");
  assert.ok(src.includes("withOwner("));
  assert.ok(src.includes("bootstrapTenantOwner("));
  assert.ok(!/console\.(log|error|warn)\([^)]*(email|claims|token)/i.test(src), "no loggea email/claims/token");
});
