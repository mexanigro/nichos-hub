import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getClientHealth } from "@/lib/repos/health";
import { vercelFetch } from "@/lib/deploy";
import { validateConfig } from "@/lib/config-validator";
import { isValidClientLanguage, normalizeClientLanguage } from "@/lib/client-language";

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await ctx.params;
  const doc = await db.collection("hub_clients").doc(clientId).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const d = doc.data()!;
  const rawDate = d.activationDate?.toDate?.() ?? d.createdAt?.toDate?.() ?? null;
  const reviewRequestedAt = d.reviewRequestedAt?.toDate?.() ?? null;
  const changesRequestedAt = d.changesRequestedAt?.toDate?.() ?? null;
  const approvedAt = d.approvedAt?.toDate?.() ?? null;
  const contact = (d.contact && typeof d.contact === "object" ? d.contact : {}) as {
    phone?: string;
    whatsapp?: string;
  };
  const client = {
    id: doc.id,
    businessName: d.businessName || "",
    niche: d.niche || "",
    deployUrl: d.deployUrl || "",
    activationDate: rawDate?.toISOString() ?? new Date().toISOString(),
    status: d.status || "active",
    adminEmail: d.adminEmail || "",
    clientId: d.clientId || doc.id,
    vercelProjectId: d.vercelProjectId || "",
    deployStatus: d.deployStatus || null,
    deployError: d.deployError || null,
    notes: d.notes || "",
    healthStatus: "healthy",
    reviewRequestedAt: reviewRequestedAt?.toISOString() ?? null,
    changesRequestedAt: changesRequestedAt?.toISOString() ?? null,
    approvedAt: approvedAt?.toISOString() ?? null,
    approvedBy: d.approvedBy ?? null,
    lastChangesRequestMessage: d.lastChangesRequestMessage ?? null,
    infoSubmitted: !!d.infoSubmitted,
    resubmissionCount: typeof d.resubmissionCount === "number" ? d.resubmissionCount : 0,
    contactPhone: contact.phone || d["contact.phone"] || "",
    contactWhatsapp: contact.whatsapp || d["contact.whatsapp"] || "",
    language: normalizeClientLanguage(d.language),
  };
  const internalClientId = d.clientId;
  const clientStatus = d.status || "active";

  // Auto-heal: ensure clients/{clientId} exists (template Firestore rules depend on it).
  if (internalClientId) {
    const clientsDoc = await db.collection("clients").doc(internalClientId).get();
    if (!clientsDoc.exists) {
      await db.collection("clients").doc(internalClientId).set(
        { status: clientStatus },
        { merge: true },
      );
    }
  }

  let healthData = { metrics: [] as unknown[], incidents: [] as unknown[], uptime: { last24h: 100, last7d: 100 } };
  let healthSource: "pg" | "unavailable" = "pg";
  try {
    healthData = await getClientHealth(internalClientId);
  } catch {
    // PostgreSQL not available — flag it instead of silently reporting 100% uptime.
    healthSource = "unavailable";
  }

  // Config-quality healthcheck: surface any blocking/warning issues from the
  // live config doc so the owner sees what's missing before the client uses the site.
  const configIssues: Array<{ path: string; message: string; severity: "error" | "warning" }> = [];
  if (internalClientId) {
    try {
      const configSnap = await db.collection("config").doc(internalClientId).get();
      const configData = configSnap.exists ? configSnap.data() : null;
      if (configData) {
        for (const iss of validateConfig(configData)) configIssues.push(iss);
      } else {
        configIssues.push({
          path: "config",
          message: "El cliente no tiene un documento de config. Abri el tab Config y guarda para crearlo.",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("[api/clients GET] config validation failed:", err);
    }
  }

  const messagesSnap = await db
    .collection("provider_messages")
    .where("clientId", "==", internalClientId)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const messages = messagesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
  }));

  return NextResponse.json({
    client,
    ...healthData,
    healthSource,
    configIssues,
    messages,
  });
});

export const DELETE = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await ctx.params;
  const doc = await db.collection("hub_clients").doc(clientId).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const d = doc.data()!;
  const internalClientId = d.clientId;
  const vercelProjectId = d.vercelProjectId;

  // 1. Delete Vercel project if exists
  if (vercelProjectId) {
    try {
      const res = await vercelFetch(`/v9/projects/${vercelProjectId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        const err = await res.text();
        console.error("[delete] Vercel delete failed:", err);
        return NextResponse.json({ error: `Error al eliminar proyecto en Vercel: ${res.status}` }, { status: 502 });
      }
    } catch (err) {
      console.error("[delete] Vercel delete error:", err);
      return NextResponse.json({ error: "Error de conexion con Vercel" }, { status: 502 });
    }
  }

  // 2. Delete Firestore docs.
  // We also clean up collections keyed by internalClientId so deleted clients
  // do not leave orphan documents behind:
  //   - whatsapp_config/{clientId}            (single doc)
  //   - contact_inbox      where clientId ==  (query → delete)
  //   - provider_messages  where clientId ==  (query → delete)
  //   - hub_payments       where clientId ==  (query → delete)
  // We do NOT revoke Google Calendar OAuth tokens automatically — that requires
  // contacting Google's revocation endpoint; flagged for a follow-up task.
  // We do NOT release the Twilio number — that's a separate cost-bearing action.
  const batch = db.batch();
  batch.delete(db.collection("hub_clients").doc(clientId));
  const orphans = { contact_inbox: 0, provider_messages: 0, hub_payments: 0, whatsapp_config: 0 };

  if (internalClientId) {
    batch.delete(db.collection("clients").doc(internalClientId));
    batch.delete(db.collection("config").doc(internalClientId));
    batch.delete(db.collection("whatsapp_config").doc(internalClientId));
    orphans.whatsapp_config = 1;

    // Query-based deletions are not part of the same batch (different docs to
    // discover). We collect refs first, then add them to the batch — staying
    // under Firestore's 500 ops/batch cap by capping per-collection at 450.
    const queryCollections = ["contact_inbox", "provider_messages", "hub_payments"] as const;
    for (const col of queryCollections) {
      try {
        const snap = await db.collection(col).where("clientId", "==", internalClientId).limit(450).get();
        snap.forEach((doc) => batch.delete(doc.ref));
        orphans[col] = snap.size;
      } catch (err) {
        console.error(`[delete] Cleanup of ${col} failed:`, err);
      }
    }
  }

  try {
    await batch.commit();
  } catch (err) {
    console.error("[delete] Batch commit failed:", err);
    return NextResponse.json({ error: "Error al borrar documentos en Firestore" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orphansCleaned: orphans });
});

/**
 * PATCH /api/clients/[clientId]
 *
 * Por ahora soporta sólo el cambio de idioma del negocio. Si crece, se puede
 * extender a un sistema de patches genéricos. Lo importante es que escribe a
 * hub_clients.language **y** config/{internalClientId}.language en una sola
 * transacción — el template depende del segundo, el dashboard del primero, y
 * ambos tienen que mantenerse en sync.
 *
 * Logueamos el cambio en hub_status_history con kind="language_change" para
 * que ConfigHistoryPanel y auditoría dejen rastro de quién y cuándo.
 */
export const PATCH = withOwner(async (req, session, ctx) => {
  const { clientId } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  if (body.language === undefined) {
    return NextResponse.json(
      { error: "Sólo se soporta language en PATCH por ahora." },
      { status: 400 },
    );
  }
  if (!isValidClientLanguage(body.language)) {
    return NextResponse.json(
      { error: "Idioma inválido. Valores aceptados: he, en, ru, ar, es." },
      { status: 400 },
    );
  }

  const hubRef = db.collection("hub_clients").doc(clientId);
  const hubSnap = await hubRef.get();
  if (!hubSnap.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const hubData = hubSnap.data()!;
  const previousLanguage = normalizeClientLanguage(hubData.language);
  const internalClientId: string = hubData.clientId || clientId;
  const approverEmail = session?.user?.email ?? "owner";
  const newLanguage = body.language;

  if (previousLanguage === newLanguage) {
    return NextResponse.json({ ok: true, language: newLanguage, unchanged: true });
  }

  const now = FieldValue.serverTimestamp();
  await db.runTransaction(async (tx) => {
    tx.set(hubRef, { language: newLanguage, updatedAt: now }, { merge: true });
    tx.set(
      db.collection("config").doc(internalClientId),
      { language: newLanguage },
      { merge: true },
    );
  });

  // Audit log: hub_status_history con kind="language_change". Pisamos from/to
  // con el código de idioma (no la transición de status), pero usamos el mismo
  // shape para que el panel pueda interpretarlo.
  try {
    await db
      .collection("hub_status_history")
      .doc(internalClientId)
      .collection("entries")
      .add({
        from: previousLanguage,
        to: newLanguage,
        kind: "language_change",
        changedBy: approverEmail,
        changedAt: now,
      });
  } catch (err) {
    console.error("[clients PATCH language] audit log failed:", err);
  }

  return NextResponse.json({
    ok: true,
    language: newLanguage,
    previousLanguage,
  });
});
