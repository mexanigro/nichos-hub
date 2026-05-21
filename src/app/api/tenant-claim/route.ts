import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db, auth } from "@/lib/firebase-admin";

/**
 * POST /api/tenant-claim
 * Setea el custom claim `clientId` en Firebase Auth para un usuario.
 * Esto es NECESARIO para que las Firestore rules del template permitan
 * al admin leer/escribir datos (appointments, customers, etc.).
 *
 * Body: { email: string, clientId: string }
 * - email: el email del admin del template (debe existir en Firebase Auth)
 * - clientId: el VITE_CLIENT_ID del deploy (ej: "demo-marco-veil-l5abc123")
 */
export const POST = withOwner(async (req) => {
  try {
    const { email, clientId } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email es requerido" }, { status: 400 });
    }
    if (!clientId || typeof clientId !== "string") {
      return NextResponse.json({ error: "clientId es requerido" }, { status: 400 });
    }

    // Verificar que el clientId existe en hub_clients
    const clientSnap = await db
      .collection("hub_clients")
      .where("clientId", "==", clientId)
      .limit(1)
      .get();

    if (clientSnap.empty) {
      return NextResponse.json(
        { error: `clientId "${clientId}" no encontrado en hub_clients` },
        { status: 404 },
      );
    }

    // Buscar el usuario en Firebase Auth por email
    let user;
    try {
      user = await auth.getUserByEmail(email.trim().toLowerCase());
    } catch {
      return NextResponse.json(
        { error: `Usuario con email "${email}" no encontrado en Firebase Auth. Debe loguearse al menos una vez en el template.` },
        { status: 404 },
      );
    }

    // Setear custom claims preservando claims existentes
    const currentClaims = (user.customClaims ?? {}) as Record<string, unknown>;
    await auth.setCustomUserClaims(user.uid, {
      ...currentClaims,
      clientId,
      tenantRole: "owner",
    });

    // Revocar refresh tokens para forzar re-auth con el nuevo claim
    await auth.revokeRefreshTokens(user.uid);

    return NextResponse.json({
      ok: true,
      uid: user.uid,
      email: user.email,
      clientId,
      tenantRole: "owner",
      note: "Claim seteado. El usuario debe cerrar sesión y volver a entrar para que tome efecto.",
    });
  } catch (err) {
    console.error("[tenant-claim] Error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

/**
 * GET /api/tenant-claim?email=xxx
 * Verifica los custom claims actuales de un usuario.
 */
export const GET = withOwner(async (req) => {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email query param requerido" }, { status: 400 });
  }

  try {
    const user = await auth.getUserByEmail(email.trim().toLowerCase());
    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      customClaims: user.customClaims ?? {},
    });
  } catch {
    return NextResponse.json(
      { error: `Usuario "${email}" no encontrado en Firebase Auth` },
      { status: 404 },
    );
  }
});
