import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { normalizeBusinessNiche } from "@/lib/client-config/services";
import { validateConfig, hasBlockingIssues } from "@/lib/config-validator";
import { diffConfig, summarizeValue } from "@/lib/config-diff";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

/**
 * Coerce legacy/wrong shapes back to what the template expects.
 *
 * Currently:
 *   - `gallery` must be `string[]`. Old data from patch-images.mjs and an
 *     earlier brand-package-import bug wrote `Array<{ src, alt }>` which makes
 *     the template render `[object Object]` and triggers a runtime error in
 *     `<Gallery />` (it calls `.slice` on the value). We flatten it here so
 *     the editor never sees the broken shape; the next PUT then re-persists
 *     the clean shape into Firestore.
 *   - `sections.services.images`, `sections.instagram.images`, `staff[].portfolio`
 *     and `owner.portfolio` are also string arrays — apply the same coercion
 *     in case any importer ever wrote rich objects there.
 */
function normalizeImageArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      if (item) out.push(item);
    } else if (item && typeof item === "object") {
      // Tolerate { src, alt } and { url } shapes that legacy data produced.
      const candidate =
        (item as { src?: unknown }).src ??
        (item as { url?: unknown }).url ??
        (item as { href?: unknown }).href;
      if (typeof candidate === "string" && candidate) out.push(candidate);
    }
  }
  return out;
}

function normalizeConfigShape(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };

  // Drop legacy `brand.favicon` URL — template only reads `brand.faviconEmoji`.
  // Mark as null so `replaceNullsWithDelete` (called later by the PUT handler)
  // converts it to a real Firestore delete on merge.
  if (out.brand && typeof out.brand === "object" && !Array.isArray(out.brand)) {
    const brand = { ...(out.brand as Record<string, unknown>) };
    if ("favicon" in brand) {
      brand.favicon = null;
    }
    out.brand = brand;
  }

  // Same for any accidental `_unused.*` payload from Brand Package legacy writes.
  if ("_unused" in out) {
    (out as Record<string, unknown>)._unused = null;
  }

  const flatGallery = normalizeImageArray(out.gallery);
  if (flatGallery !== undefined) out.gallery = flatGallery;

  if (out.sections && typeof out.sections === "object" && !Array.isArray(out.sections)) {
    const sections = { ...(out.sections as Record<string, unknown>) };
    if (sections.services && typeof sections.services === "object") {
      const services = { ...(sections.services as Record<string, unknown>) };
      const flat = normalizeImageArray(services.images);
      if (flat !== undefined) services.images = flat;
      sections.services = services;
    }
    if (sections.instagram && typeof sections.instagram === "object") {
      const instagram = { ...(sections.instagram as Record<string, unknown>) };
      const flat = normalizeImageArray(instagram.images);
      if (flat !== undefined) instagram.images = flat;
      sections.instagram = instagram;
    }
    out.sections = sections;
  }

  if (Array.isArray(out.staff)) {
    out.staff = (out.staff as unknown[]).map((m) => {
      if (!m || typeof m !== "object") return m;
      const next = { ...(m as Record<string, unknown>) };
      const flat = normalizeImageArray(next.portfolio);
      if (flat !== undefined) next.portfolio = flat;
      return next;
    });
  }

  if (out.owner && typeof out.owner === "object") {
    const owner = { ...(out.owner as Record<string, unknown>) };
    const flat = normalizeImageArray(owner.portfolio);
    if (flat !== undefined) owner.portfolio = flat;
    out.owner = owner;
  }

  return out;
}

/** GET /api/config/:clientId — read Firestore config/{clientId} */
export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  const snap = await db.collection("config").doc(clientId).get();
  if (!snap.exists) return NextResponse.json({});
  const data = snap.data() ?? {};
  return NextResponse.json(normalizeConfigShape(data));
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
export const PUT = withOwner(async (req, session, ctx) => {
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
  const shapedBody = normalizeConfigShape(rawBody);
  const normalizedBody = withNormalizedBusinessType(shapedBody, deployBusinessType);

  // Reject the write if the body contains a blocking shape/semantics error.
  // Warnings are returned to the client but do not block.
  const issues = validateConfig(normalizedBody);
  if (hasBlockingIssues(issues)) {
    return NextResponse.json(
      { error: "Config invalido", issues: issues.filter((i) => i.severity === "error") },
      { status: 422 },
    );
  }

  // Snapshot the previous state for the audit log entry. We diff against the
  // *normalized* shape so the log shows what actually changed on disk.
  let previousData: Record<string, unknown> = {};
  try {
    const prev = await db.collection("config").doc(clientId).get();
    if (prev.exists) previousData = normalizeConfigShape(prev.data() ?? {});
  } catch (err) {
    console.error("[api/config PUT] failed to snapshot prev for audit log:", err);
  }

  const cleaned = replaceNullsWithDelete(normalizedBody);
  try {
    await db.collection("config").doc(clientId).set(cleaned, { merge: true });
  } catch (err) {
    console.error("[api/config PUT]", err);
    return NextResponse.json({ error: "Error al guardar configuracion" }, { status: 500 });
  }

  // Audit log: write a compact summary of what changed to
  // config_history/{clientId}/entries/{auto}. Best-effort; we don't fail the
  // PUT if the audit write errors out (e.g. quota).
  try {
    const diff = diffConfig(previousData, normalizedBody);
    if (diff.length > 0) {
      const changes = diff.slice(0, 100).map((d) => ({
        path: d.path,
        kind: d.kind,
        beforeSummary: summarizeValue(d.before),
        afterSummary: summarizeValue(d.after),
      }));
      await db.collection("config_history").doc(clientId).collection("entries").add({
        changedAt: FieldValue.serverTimestamp(),
        changedBy: session.user?.email ?? "owner",
        changeCount: diff.length,
        truncated: diff.length > 100,
        changes,
      });
    }
  } catch (err) {
    console.error("[api/config PUT] audit log write failed:", err);
  }

  const warning =
    requestedBusinessType && normalizeBusinessNiche(requestedBusinessType) !== deployBusinessType
      ? `El nicho guardado se normalizo a "${deployBusinessType}" porque debe coincidir con el nicho del deploy.`
      : undefined;

  return NextResponse.json({
    ok: true,
    normalizedBusinessType: deployBusinessType,
    warning,
    warnings: issues.filter((i) => i.severity === "warning"),
  });
});
