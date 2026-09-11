/**
 * Claims de tenant en Firebase Auth: `clientId` + `tenantRole: "owner"`, y
 * revocación de refresh tokens para forzar re-auth. Es la única implementación:
 * la usan /api/tenant-claim y el bootstrap del dueño (admin-bootstrap.ts).
 * `auth` se inyecta (Admin Auth o un doble en tests); sin `@/`.
 */

export interface TenantClaimAuth {
  getUserByEmail(email: string): Promise<{ uid: string; email?: string; customClaims?: Record<string, unknown> }>;
  setCustomUserClaims(uid: string, claims: Record<string, unknown>): Promise<void>;
  revokeRefreshTokens(uid: string): Promise<void>;
}

export type TenantClaimResult =
  | { ok: true; uid: string; email: string; clientId: string; tenantRole: "owner" }
  | { ok: false; reason: "user_not_found" };

/** Setea las claims preservando las existentes y revoca los refresh tokens. */
export async function setTenantOwnerClaim(params: { auth: TenantClaimAuth; email: string; clientId: string }): Promise<TenantClaimResult> {
  const { auth, clientId } = params;
  const email = params.email.trim().toLowerCase();
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    return { ok: false, reason: "user_not_found" };
  }
  const currentClaims = (user.customClaims ?? {}) as Record<string, unknown>;
  await auth.setCustomUserClaims(user.uid, { ...currentClaims, clientId, tenantRole: "owner" });
  await auth.revokeRefreshTokens(user.uid);
  return { ok: true, uid: user.uid, email: user.email ?? email, clientId, tenantRole: "owner" };
}
