import { NextRequest, NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db, auth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { VALID_NICHES, type BusinessNiche } from "@/lib/niche-defaults";
import { buildProvisionDocs } from "@/lib/provisioning";
import { bootstrapTenantOwner } from "@/lib/admin-bootstrap";
import { deployToVercel } from "@/lib/deploy";
import { isValidClientLanguage, DEFAULT_CLIENT_LANGUAGE, type ClientLanguage, VALID_CLIENT_LANGUAGES_LABEL } from "@/lib/client-language";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export const POST = withOwner(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      businessName,
      niche,
      businessMode = "team",
      phone,
      email,
      address,
      instagram,
      tagline,
      description,
      language = "he",
      adminEmail,
    } = body;

    if (!businessName || businessName.trim().length < 2) {
      return NextResponse.json({ error: "Nombre del negocio requerido (min 2 caracteres)" }, { status: 400 });
    }
    if (!niche || !VALID_NICHES.includes(niche)) {
      return NextResponse.json({ error: "Nicho invalido" }, { status: 400 });
    }
    // language es opcional; si no viene cae al default. Si viene, validar.
    if (body.language !== undefined && !isValidClientLanguage(body.language)) {
      return NextResponse.json(
        { error: `Idioma inválido. Valores aceptados: ${VALID_CLIENT_LANGUAGES_LABEL}.` },
        { status: 400 },
      );
    }
    const lang: ClientLanguage = isValidClientLanguage(language)
      ? language
      : DEFAULT_CLIENT_LANGUAGE;

    const nicheKey = niche as BusinessNiche;
    const mode = businessMode === "solo" ? "solo" : "team";
    const slug = `demo-${slugify(businessName.trim())}-${crypto.randomUUID().slice(0, 8)}`;
    const domain = `${slug}.arzac.studio`;
    // N08 T1: los tres documentos del alta salen de un constructor puro (src/lib/provisioning.ts, con test):
    // config nace con el catálogo del nicho (services/staff/businessRules del preset del template) y adminEmail,
    // que es lo que deploy.ts propaga como BUSINESS_OWNER_EMAIL.
    const docs = buildProvisionDocs({
      businessName, niche: nicheKey, mode, slug, domain, language: lang,
      phone, email, address, instagram, tagline, description, adminEmail,
    });

    // 1. Create hub_clients doc
    const hubRef = db.collection("hub_clients").doc();
    await hubRef.set(docs.hubClient);

    // 2. Create clients/{clientId} — template depends on this for Firestore rules
    await db.collection("clients").doc(slug).set(docs.client);

    // 3. Create config/{clientId} — remote config for the landing page
    await db.collection("config").doc(slug).set(docs.config);

    // 3b. Dueño en admin_users del tenant (antes era un botón aparte en la ficha; sin él el CRM responde 403).
    let ownerBootstrap: Record<string, unknown> | null = null;
    if (docs.ownerBootstrap) {
      try {
        const r = await bootstrapTenantOwner({ ...docs.ownerBootstrap, db, auth });
        ownerBootstrap = r.ok
          ? { ok: true, email: r.email, rosterWritten: r.rosterWritten, claimsSynced: r.claimsSynced, ...(r.claimsReason ? { claimsReason: r.claimsReason } : {}) }
          : { ok: false, status: r.status, error: r.error };
      } catch (err) {
        ownerBootstrap = { ok: false, error: err instanceof Error ? err.message.slice(0, 300) : "bootstrap failed" };
      }
      await hubRef.update({ ownerBootstrap });
    }

    // 4. Trigger Vercel deploy (direct call, no self-fetch)
    let deployResult: { projectId?: string; domain?: string; error?: string } = {};
    try {
      const result = await deployToVercel({ clientId: slug, niche: nicheKey, hubDocId: hubRef.id });
      // T1b: un rechazo de Vercel (variables/dominio/deployment) ya quedó en hub_clients como error; se refleja aquí.
      deployResult = result.status === "error"
        ? { projectId: result.projectId, domain: result.domain, error: `${result.stage}: ${result.deployError}`.slice(0, 500) }
        : { projectId: result.projectId, domain: result.domain };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deploy failed";
      console.error("[provision] Deploy error:", msg);
      await hubRef.update({ deployStatus: "error", deployError: msg.slice(0, 500) });
      deployResult = { error: msg.slice(0, 500) };
    }

    return NextResponse.json({
      hubDocId: hubRef.id,
      clientId: slug,
      domain,
      deployStatus: deployResult.error ? "error" : "building",
      deployError: deployResult.error || null,
      vercelProjectId: deployResult.projectId || null,
      ownerBootstrap,
    }, { status: 201 });
  } catch (error) {
    console.error("[provision] Error:", error);
    return NextResponse.json({ error: "Error interno al provisionar cliente" }, { status: 500 });
  }
});

export const PUT = withOwner(async (req: NextRequest, session) => {
  try {
    const { hubDocId, status } = await req.json();

    if (!hubDocId || !status) {
      return NextResponse.json({ error: "hubDocId y status son requeridos" }, { status: 400 });
    }

    if (!["active", "demo", "trial"].includes(status)) {
      return NextResponse.json({ error: "Status invalido" }, { status: 400 });
    }

    const hubDoc = await db.collection("hub_clients").doc(hubDocId).get();
    if (!hubDoc.exists) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const data = hubDoc.data()!;
    const previousStatus: string = data.status || "active";
    const approverEmail = session?.user?.email ?? "owner";

    const updates: Record<string, unknown> = { status, updatedAt: FieldValue.serverTimestamp() };
    // Marca de activación (demo → active o pending_review → active)
    if (status === "active" && (previousStatus === "demo" || previousStatus === "pending_review")) {
      updates.activatedAt = FieldValue.serverTimestamp();
    }
    // Aprobación explícita desde pending_review
    if (status === "active" && previousStatus === "pending_review") {
      updates.approvedBy = approverEmail;
      updates.approvedAt = FieldValue.serverTimestamp();
    }

    await db.collection("hub_clients").doc(hubDocId).update(updates);

    // Sync to clients/{clientId}
    if (data.clientId) {
      await db.collection("clients").doc(data.clientId).set(
        { status: status === "demo" ? "active" : status },
        { merge: true },
      );
    }

    // Audit log: hub_status_history/{clientId}/entries — solo si el clientId existe
    // (en este endpoint hubDocId === clientId post-Cardcom, pero usamos data.clientId
    // por compatibilidad con flows legacy).
    const auditClientId = data.clientId || hubDocId;
    if (auditClientId && previousStatus !== status) {
      try {
        await db
          .collection("hub_status_history")
          .doc(auditClientId)
          .collection("entries")
          .add({
            kind: "status_change",
            from: previousStatus,
            to: status,
            changedBy: approverEmail,
            changedAt: FieldValue.serverTimestamp(),
            hubDocId,
          });
      } catch (err) {
        console.error("[provision PUT] audit log write failed:", err);
      }
    }

    return NextResponse.json({ ok: true, status, previousStatus });
  } catch (error) {
    console.error("[provision PUT] Error:", error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
});
