import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { normalizeBusinessNiche } from "@/lib/client-config/services";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

/** GET /api/config/:clientId — read Firestore config/{clientId} */
export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  const snap = await db.collection("config").doc(clientId).get();
  return NextResponse.json(snap.exists ? snap.data() : {});
});

/**
 * Recursively replace `null` values with FieldValue.delete() so that
 * Firestore `set({merge:true})` actually removes cleared fields instead
 * of silently keeping the old value.
 */
function replaceNullsWithDelete(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null) {
      out[k] = FieldValue.delete();
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = replaceNullsWithDelete(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function getNestedBusinessType(body: Record<string, unknown>): string | undefined {
  const business = body.business;
  if (!business || typeof business !== "object" || Array.isArray(business)) return undefined;
  const type = (business as Record<string, unknown>).type;
  return typeof type === "string" ? type : undefined;
}

async function getDeployNiche(clientId: string, fallback?: string) {
  const snap = await db.collection("hub_clients").where("clientId", "==", clientId).limit(1).get();
  const hubNiche = snap.empty ? undefined : snap.docs[0].data()?.niche;
  return normalizeBusinessNiche(hubNiche ?? fallback);
}

function withNormalizedBusinessType(body: Record<string, unknown>, businessType: string): Record<string, unknown> {
  const currentBusiness =
    body.business && typeof body.business === "object" && !Array.isArray(body.business)
      ? (body.business as Record<string, unknown>)
      : {};

  return {
    ...body,
    business: {
      ...currentBusiness,
      type: businessType,
    },
  };
}

/** PUT /api/config/:clientId — merge into Firestore config/{clientId} */
export const PUT = withOwner(async (req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  const body = await req.json();

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const rawBody = body as Record<string, unknown>;
  const requestedBusinessType = getNestedBusinessType(rawBody);
  const deployBusinessType = await getDeployNiche(clientId, requestedBusinessType);
  const normalizedBody = withNormalizedBusinessType(rawBody, deployBusinessType);
  const cleaned = replaceNullsWithDelete(normalizedBody);
  try {
    await db.collection("config").doc(clientId).set(cleaned, { merge: true });
  } catch (err) {
    console.error("[api/config PUT]", err);
    return NextResponse.json({ error: "Error al guardar configuracion" }, { status: 500 });
  }
  const warning =
    requestedBusinessType && normalizeBusinessNiche(requestedBusinessType) !== deployBusinessType
      ? `El nicho guardado se normalizo a "${deployBusinessType}" porque debe coincidir con el nicho del deploy.`
      : undefined;

  return NextResponse.json({ ok: true, normalizedBusinessType: deployBusinessType, warning });
});
