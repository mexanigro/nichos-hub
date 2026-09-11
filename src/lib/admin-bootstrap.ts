/**
 * Bootstrap del dueño de un tenant en `admin_users` (el roster que lee el
 * template en requireAdminAuth) + claims de tenant. El template solo crea
 * roster por invitación de un admin existente; el primero lo crea el hub.
 *
 * Limitación conocida (D-21): el id del documento es el email, así que un
 * email solo puede ser admin de UN tenant; si ya lo es de otro, 409.
 * Puro: `db`, `auth` y `now` inyectados; nunca devuelve claves ni tokens.
 */
import { setTenantOwnerClaim, type TenantClaimAuth } from "./tenant-claim.ts";

export interface AdminUsersDb {
  collection(name: "admin_users"): {
    doc(id: string): {
      get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
      set(data: Record<string, unknown>): Promise<unknown>;
    };
  };
}

export type BootstrapResult =
  | { ok: true; email: string; clientId: string; rosterWritten: boolean; claimsSynced: boolean; claimsReason?: "user_not_found" }
  | { ok: false; status: 400 | 409; error: string };

interface BootstrapParams {
  email: string;
  clientId: string;
  db: AdminUsersDb;
  auth: TenantClaimAuth;
  now?: Date;
}

export async function bootstrapTenantOwner({ email: rawEmail, clientId, db, auth, now = new Date() }: BootstrapParams): Promise<BootstrapResult> {
  const email = (rawEmail ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: false, status: 400, error: "email es requerido" };
  if (!clientId || !clientId.trim()) return { ok: false, status: 400, error: "clientId es requerido" };

  const ref = db.collection("admin_users").doc(email);
  const snap = await ref.get();
  let rosterWritten = false;
  if (snap.exists) {
    const existing = snap.data()?.clientId;
    if (existing !== clientId) {
      return { ok: false, status: 409, error: `${email} ya es admin del tenant "${String(existing)}"; admin_users usa el email como id y no se sobrescribe (D-21)` };
    }
  } else {
    await ref.set({ email, clientId, role: "owner", invitedBy: "system", invitedAt: now, status: "active" });
    rosterWritten = true;
  }

  // Claims solo con el roster ya escrito (o ya existente para este tenant).
  const claims = await setTenantOwnerClaim({ auth, email, clientId });
  if (!claims.ok) return { ok: true, email, clientId, rosterWritten, claimsSynced: false, claimsReason: claims.reason };
  return { ok: true, email, clientId, rosterWritten, claimsSynced: true };
}
