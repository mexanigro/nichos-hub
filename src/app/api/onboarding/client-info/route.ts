import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { isRateLimited } from "@/lib/rate-limit";
import { resolveBranding } from "@/lib/branding-resolver";
import { sendEmail } from "@/lib/email";
import { infoSubmittedThanks, changesResubmitted } from "@/lib/email-templates";
import { verifyOnboardingToken } from "@/lib/onboarding-token";
import { diffConfig, summarizeValue } from "@/lib/config-diff";
import { isValidClientLanguage } from "@/lib/client-language";
import { NICHE_SERVICES, type BusinessNiche } from "@/lib/client-config/services";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://arzac.studio";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "website@arzac.studio";

/**
 * Submit final del wizard /onboarding/info.
 *
 * Escribe a tres lugares:
 *   1. config/{clientId}     → fuente de configuracion remota del template.
 *   2. clients/{clientId}    → flag de estado leido por el template (kill-switch).
 *   3. hub_clients/{clientId}→ vista del owner. Marca status=pending_review.
 *
 * El status "pending_review" indica que Liam tiene que entrar al dashboard
 * a revisar branding/logo/copy antes de aprobar el deploy. El deploy mismo
 * es accion manual desde el hub (boton "Publicar sitio").
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (isRateLimited(ip, "client-info", 10, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { clientId } = body;

    if (!clientId || typeof clientId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid clientId" },
        { status: 400 },
      );
    }

    // Idioma del cliente: si viene en el body lo validamos. Si no viene, no
    // pisamos lo que ya está en hub_clients (lo respeta el resto del flujo).
    if (body.locale !== undefined && !isValidClientLanguage(body.locale)) {
      return NextResponse.json(
        { error: "Idioma inválido. Valores aceptados: he, en, ru, ar, es." },
        { status: 400 },
      );
    }
    const clientLanguage: string | undefined = isValidClientLanguage(body.locale)
      ? body.locale
      : undefined;

    // Si el wizard mandó el JWT (defense-in-depth), verificamos que el clientId
    // del body coincida con el del token y que un token resubmit solo aplique
    // cuando el cliente está efectivamente en changes_requested.
    const tokenHeader = req.headers.get("x-onboarding-token") || "";
    if (tokenHeader) {
      const tokenPayload = await verifyOnboardingToken(tokenHeader);
      if (!tokenPayload) {
        return NextResponse.json({ error: "Token invalido o expirado" }, { status: 401 });
      }
      if (tokenPayload.clientId !== clientId) {
        return NextResponse.json({ error: "clientId no coincide con el token" }, { status: 403 });
      }
      if (tokenPayload.mode === "resubmit") {
        const hubSnap = await db.collection("hub_clients").doc(clientId).get();
        const status = hubSnap.exists ? hubSnap.data()?.status : undefined;
        if (status !== "changes_requested") {
          return NextResponse.json(
            { error: "El link de reenvío ya no es válido. Pedile a Liam un link nuevo." },
            { status: 403 },
          );
        }
      }
    }

    // Build config update from submitted data
    const niche =
      body.niche === "otro" ? "estetica" : body.niche || "estetica";

    const branding = body.colors
      ? resolveBranding({ niche, colors: body.colors })
      : { themeOverrides: {} };

    const configUpdate: Record<string, unknown> = {
      "business.type": niche,
      "business.mode": body.businessMode || "team",
      "business.name": body.businessName || "",
    };

    // Persistir idioma del cliente en config (lo lee el template para localizar
    // labels de servicios, formatos de hora, etc.). Sólo escribimos si vino
    // válido; defaults van en cardcom-promote.ts al crear el hub_clients.
    if (clientLanguage) {
      configUpdate["language"] = clientLanguage;
    }

    // Brand
    if (body.businessName)
      configUpdate["brand.name"] = body.businessName;
    if (body.tagline) configUpdate["brand.tagline"] = body.tagline;
    if (body.description)
      configUpdate["brand.description"] = body.description;
    if (body.faviconEmoji) configUpdate["brand.faviconEmoji"] = body.faviconEmoji;

    // Contact (flatten for dot-notation merge)
    if (body.contact) {
      if (body.contact.phone)
        configUpdate["contact.phone"] = body.contact.phone;
      if (body.contact.email)
        configUpdate["contact.email"] = body.contact.email;
      if (body.contact.instagram)
        configUpdate["contact.instagram"] = body.contact.instagram;
      if (body.contact.facebook)
        configUpdate["contact.facebook"] = body.contact.facebook;
      if (body.contact.whatsapp)
        configUpdate["contact.whatsapp"] = body.contact.whatsapp;
      if (body.contact.address) {
        if (body.contact.address.street)
          configUpdate["contact.address.street"] = body.contact.address.street;
        if (body.contact.address.district)
          configUpdate["contact.address.district"] =
            body.contact.address.district;
        if (body.contact.address.city)
          configUpdate["contact.address.city"] = body.contact.address.city;
      }
    }

    // Services
    //
    // El template tiene su propio dict de labels por idioma (t.serviceLabels[id]).
    // Persistimos sólo id + price + duration por servicio. Si el cliente cambió
    // el label respecto del default del nicho (por ej, dejó "Haircut" como
    // "Corte masculino"), guardamos `customLabel` para que el template lo
    // use por encima del dict. Para servicios custom (id="custom-…"), siempre
    // hay customLabel — no hay default contra qué comparar.
    if (Array.isArray(body.services) && body.services.length > 0) {
      const defaultsByNiche = (NICHE_SERVICES as Record<BusinessNiche, { id: string; label: string }[]>)[
        niche as BusinessNiche
      ];
      const defaultLabelById = new Map<string, string>();
      if (defaultsByNiche) {
        for (const d of defaultsByNiche) defaultLabelById.set(d.id, d.label);
      }

      configUpdate["services"] = body.services.map(
        (s: { id: string; label?: string; price?: string; duration?: string }) => {
          const id = s.id;
          const submittedLabel = (s.label ?? "").trim();
          const defaultLabel = defaultLabelById.get(id);
          const isCustomId = !defaultLabel; // id no presente en defaults del nicho
          const customLabel =
            isCustomId
              ? submittedLabel
              : submittedLabel && submittedLabel !== defaultLabel
                ? submittedLabel
                : "";

          const entry: {
            id: string;
            price: number;
            duration: number;
            customLabel?: string;
          } = {
            id,
            price: s.price ? Number(s.price) || 0 : 0,
            duration: s.duration ? Number(s.duration) || 30 : 30,
          };
          if (customLabel) entry.customLabel = customLabel;
          return entry;
        },
      );
    }

    // Hours
    if (body.hours && typeof body.hours === "object") {
      configUpdate["hours"] = body.hours;
    }

    // Owner
    if (body.ownerName) configUpdate["owner.name"] = body.ownerName;
    if (body.ownerRole) configUpdate["owner.role"] = body.ownerRole;
    if (body.ownerBio) configUpdate["owner.bio"] = body.ownerBio;

    // Accent color / branding
    if (body.accentColor) {
      configUpdate["themeOverrides.accentColor"] = body.accentColor;
    }
    if (Object.keys(branding.themeOverrides).length > 0) {
      for (const [k, v] of Object.entries(branding.themeOverrides)) {
        configUpdate[`themeOverrides.${k}`] = v;
      }
    }

    // Branding input (raw user input for re-resolution)
    configUpdate["brandingInput.colors"] = body.colors || "";

    // Image uploads (URLs from /api/onboarding/upload)
    if (typeof body.logoUrl === "string" && body.logoUrl) {
      configUpdate["brand.logo"] = body.logoUrl;
    }
    if (typeof body.logoDarkUrl === "string" && body.logoDarkUrl) {
      configUpdate["brand.logoDark"] = body.logoDarkUrl;
    }
    if (typeof body.ownerPhotoUrl === "string" && body.ownerPhotoUrl) {
      configUpdate["owner.photo"] = body.ownerPhotoUrl;
    }
    if (typeof body.heroImageUrl === "string" && body.heroImageUrl) {
      configUpdate["hero.backgroundImage"] = body.heroImageUrl;
    }
    if (Array.isArray(body.staffPhotoUrls) && body.staffPhotoUrls.length > 0) {
      // Stub: array de URLs. Liam mapea a staff[].photo en config-tab cuando
      // tiene el contexto de quien es cada uno (nombre/role).
      configUpdate["staffPhotos"] = body.staffPhotoUrls;
    }
    if (Array.isArray(body.galleryImageUrls) && body.galleryImageUrls.length > 0) {
      configUpdate["gallery"] = body.galleryImageUrls.map((url: string) => ({ url }));
    }

    // ── Campos estructurados nuevos (Bloque 4) ─────────────────────────
    // Shapes alineados con los editors de src/components/config-editors/.

    // Benefits → sections.whyChooseUs.benefits[]: { title, desc, iconName }
    if (Array.isArray(body.benefits) && body.benefits.length > 0) {
      const cleaned = body.benefits
        .filter((b: { title?: string; desc?: string }) => b.title?.trim() || b.desc?.trim())
        .map((b: { title?: string; desc?: string; iconName?: string }) => ({
          title: (b.title || "").trim(),
          desc: (b.desc || "").trim(),
          iconName: b.iconName || "Star",
        }));
      if (cleaned.length > 0) configUpdate["sections.whyChooseUs.benefits"] = cleaned;
    }
    if (typeof body.whyChooseUsMainImage === "string" && body.whyChooseUsMainImage) {
      configUpdate["sections.whyChooseUs.mainImage"] = body.whyChooseUsMainImage;
    }

    // Testimonials → testimonials[]: { name, title, text, rating }
    if (Array.isArray(body.testimonials) && body.testimonials.length > 0) {
      const cleaned = body.testimonials
        .filter((t: { text?: string; name?: string }) => t.text?.trim() || t.name?.trim())
        .map((t: { name?: string; title?: string; text?: string; rating?: number }) => ({
          name: (t.name || "").trim(),
          title: (t.title || "").trim(),
          text: (t.text || "").trim(),
          rating: typeof t.rating === "number" && t.rating >= 1 && t.rating <= 5 ? t.rating : 5,
        }));
      if (cleaned.length > 0) configUpdate["testimonials"] = cleaned;
    }

    // FAQ → sections.faq.items[]: { q, a }
    if (Array.isArray(body.faqItems) && body.faqItems.length > 0) {
      const cleaned = body.faqItems
        .filter((f: { q?: string; a?: string }) => f.q?.trim() && f.a?.trim())
        .map((f: { q: string; a: string }) => ({ q: f.q.trim(), a: f.a.trim() }));
      if (cleaned.length > 0) configUpdate["sections.faq.items"] = cleaned;
    }

    // Snapshot del config previo — usado más abajo para escribir un audit log
    // en config_history con changedBy="customer" cuando es un resubmit. Esto
    // permite que ConfigHistoryPanel muestre qué tocó el cliente (y T4 abre
    // el modal de diff sobre la misma data).
    let previousConfig: Record<string, unknown> = {};
    try {
      const prevSnap = await db.collection("config").doc(clientId).get();
      if (prevSnap.exists) previousConfig = prevSnap.data() ?? {};
    } catch (err) {
      console.error("[client-info] snapshot previo config falló:", err);
    }

    // Write to Firestore config — usa set+merge para que tambien funcione si
    // el doc no existe (defensive: en el flow post-Cardcom, el doc se crea
    // en cardcom-promote.ts, pero esto blinda el endpoint).
    await db
      .collection("config")
      .doc(clientId)
      .set(configUpdate, { merge: true });

    // ── Detectar resubmit ANTES del update ─────────────────────────────
    // Resubmit = el cliente ya había enviado info antes Y Liam pidió cambios.
    // Necesitamos leer el doc actual para saber si limpiamos changesRequested* y
    // si disparamos email a Liam.
    const now = FieldValue.serverTimestamp();
    let previousStatus: string | undefined;
    let previousChangesMessage: string | undefined;
    let hubDocRef: FirebaseFirestore.DocumentReference | null = null;

    const hubByDocId = await db.collection("hub_clients").doc(clientId).get();
    if (hubByDocId.exists) {
      hubDocRef = hubByDocId.ref;
      const d = hubByDocId.data() || {};
      previousStatus = typeof d.status === "string" ? d.status : undefined;
      previousChangesMessage = typeof d.lastChangesRequestMessage === "string"
        ? d.lastChangesRequestMessage
        : undefined;
    } else {
      const hubSnap = await db
        .collection("hub_clients")
        .where("clientId", "==", clientId)
        .limit(1)
        .get();
      if (!hubSnap.empty) {
        hubDocRef = hubSnap.docs[0].ref;
        const d = hubSnap.docs[0].data() || {};
        previousStatus = typeof d.status === "string" ? d.status : undefined;
        previousChangesMessage = typeof d.lastChangesRequestMessage === "string"
          ? d.lastChangesRequestMessage
          : undefined;
      }
    }

    const isResubmit = previousStatus === "changes_requested";

    const hubUpdate: Record<string, unknown> = {
      infoSubmitted: true,
      infoSubmittedAt: now,
      status: "pending_review",
      reviewRequestedAt: now,
      lastEditedAt: now,
      updatedAt: now,
    };
    if (body.businessName) hubUpdate.businessName = body.businessName;
    if (body.niche) hubUpdate.niche = body.niche;
    if (clientLanguage) hubUpdate.language = clientLanguage;
    if (body.contact?.email) hubUpdate["contact.email"] = body.contact.email;
    if (body.contact?.whatsapp)
      hubUpdate["contact.whatsapp"] = body.contact.whatsapp;

    if (isResubmit) {
      // Limpiar marcas del ciclo changes_requested + bumpear contador.
      hubUpdate.changesRequestedAt = FieldValue.delete();
      hubUpdate.changesRequestedBy = FieldValue.delete();
      hubUpdate.lastChangesRequestMessage = FieldValue.delete();
      hubUpdate.resubmissionCount = FieldValue.increment(1);
      hubUpdate.lastResubmittedAt = now;
    }

    if (hubDocRef) {
      await hubDocRef.set(hubUpdate, { merge: true });
    } else {
      // Defensive: no existe en hub_clients. Lo creamos minimal para que
      // aparezca en el dashboard. Esto NO deberia pasar en el flow normal
      // (cardcom-promote.ts ya crea el doc), pero blinda flows alternativos.
      const newRef = db.collection("hub_clients").doc(clientId);
      await newRef.set(
        {
          clientId,
          ...hubUpdate,
          createdAt: now,
          source: "info-submit-fallback",
        },
        { merge: true },
      );
      hubDocRef = newRef;
    }

    // Audit log de cambios al config — escribimos siempre que haya snapshot
    // previo, marcado con changedBy="customer" para que el panel lo distinga
    // del owner. Si es resubmit, agregamos kind="resubmit" para que la UI
    // muestre el contexto del ciclo "Liam pidió cambios → cliente reenvió".
    if (Object.keys(previousConfig).length > 0) {
      try {
        const afterSnap = await db.collection("config").doc(clientId).get();
        const afterConfig = afterSnap.exists ? afterSnap.data() ?? {} : {};
        const diff = diffConfig(previousConfig, afterConfig);
        if (diff.length > 0) {
          const changes = diff.slice(0, 100).map((d) => ({
            path: d.path,
            kind: d.kind,
            beforeSummary: summarizeValue(d.before),
            afterSummary: summarizeValue(d.after),
          }));
          await db
            .collection("config_history")
            .doc(clientId)
            .collection("entries")
            .add({
              changedAt: now,
              changedBy: "customer",
              changeCount: diff.length,
              truncated: diff.length > 100,
              changes,
              kind: isResubmit ? "resubmit" : "info_submitted",
            });
        }
      } catch (err) {
        console.error("[client-info] config_history write failed:", err);
      }
    }

    // Audit log de la transición — sólo si hubo cambio real de status.
    if (previousStatus && previousStatus !== "pending_review") {
      try {
        await db
          .collection("hub_status_history")
          .doc(clientId)
          .collection("entries")
          .add({
            kind: isResubmit ? "customer_resubmit" : "info_submitted",
            from: previousStatus,
            to: "pending_review",
            changedBy: "customer",
            changedAt: now,
            reason: isResubmit ? "customer_resubmit" : "info_submitted",
          });
      } catch (err) {
        console.error("[client-info] audit log failed:", err);
      }
    }

    // Sync a clients/{clientId} — el template lee status desde aca.
    // pending_review es un estado valido en el template (similar a pending_provision):
    // el sitio no esta publicado todavia, esperando aprobacion de Liam.
    await db.collection("clients").doc(clientId).set(
      { status: "pending_review", reviewRequestedAt: now },
      { merge: true },
    );

    // Email de "gracias" al cliente — best-effort. Mismo template para submit
    // inicial y resubmit; el ciclo de espera es el mismo.
    const customerEmail = body.contact?.email;
    if (typeof customerEmail === "string" && customerEmail.includes("@")) {
      const tpl = infoSubmittedThanks({
        name: body.ownerName || body.businessName,
        businessName: body.businessName,
        statusUrl: `${SITE}/onboarding/status/${clientId}`,
      });
      sendEmail({
        to: customerEmail,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
        tag: isResubmit ? "info_resubmitted_thanks" : "info_submitted_thanks",
      }).catch((e) => console.error("[client-info] customer email failed:", e));
    }

    // Email a Liam — sólo si es resubmit. En submit inicial, Liam se entera
    // por el dashboard (pending_review aparece en /clients con filtro).
    if (isResubmit) {
      const tpl = changesResubmitted({
        clientId,
        businessName: body.businessName,
        customerEmail: typeof customerEmail === "string" ? customerEmail : undefined,
        customerName: body.ownerName,
        previousMessage: previousChangesMessage,
        reviewUrl: `${SITE}/clients/${clientId}`,
      });
      sendEmail({
        to: OWNER_EMAIL,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
        tag: "changes_resubmitted",
      }).catch((e) => console.error("[client-info] owner email failed:", e));
    }

    return NextResponse.json({
      ok: true,
      status: "pending_review",
      clientId,
      wasResubmit: isResubmit,
    });
  } catch (error) {
    console.error("Client info submission error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    );
  }
}
