import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { normalizeAppointmentRow } from "@/lib/crm-import-rows";
import { coreContactAdapterFromEnvironment, CoreContactAdapterError } from "@/lib/core-contact-adapter";
import { importCustomerContacts, type CustomerImportRow } from "@/lib/core-contact-shell";

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;
const BATCH_SIZE = 500;

interface CustomerRow extends CustomerImportRow {
  source?: string;
  // `preferences` retirado (N05 · T4, D-5 b1); `visitCount`/`paymentMethod`
  // retirados (BP2-01 · C4-2): el shell no los recibe y el modal ya no los ofrece.
}

interface AppointmentRow {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceId: string;
  staffId?: string;
  date: string;
  time: string;
  duration?: number;
  status?: string;
  paymentStatus?: string;
  amountPaidCents?: number;
}

type ImportRow = CustomerRow | AppointmentRow;

/**
 * POST /api/crm/import
 * Batch-imports customers or appointments into Firestore.
 * Body: { clientId, type: "customers"|"appointments", rows: ImportRow[] }
 */
export const POST = withOwner(async (req) => {
  const body = await req.json();
  const { clientId, type, rows, importId } = body as {
    clientId: string;
    type: "customers" | "appointments";
    rows: ImportRow[];
    importId?: string;
  };

  if (!clientId || !CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "clientId invalido" }, { status: 400 });
  }
  if (!type || !["customers", "appointments"].includes(type)) {
    return NextResponse.json({ error: "type debe ser 'customers' o 'appointments'" }, { status: 400 });
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows vacio" }, { status: 400 });
  }
  if (rows.length > 5000) {
    return NextResponse.json({ error: "Maximo 5000 registros por importacion" }, { status: 400 });
  }

  if (type === "customers") {
    if (!importId || !/^[a-zA-Z0-9_-]{16,80}$/.test(importId)) {
      return NextResponse.json({ error: "importId invalido" }, { status: 400 });
    }
    const hubClient = await db.collection("hub_clients").doc(clientId).get();
    const targetClientId = hubClient.data()?.clientId;
    if (!hubClient.exists || typeof targetClientId !== "string" || !CLIENT_ID_RE.test(targetClientId)) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
    let adapter;
    try {
      adapter = coreContactAdapterFromEnvironment();
      adapter.assertScope(targetClientId, "hub-import-contacts");
    } catch (error) {
      const failure = error instanceof CoreContactAdapterError ? error : new CoreContactAdapterError(503, "contact_adapter_unavailable");
      return NextResponse.json({ error: failure.code }, { status: failure.status });
    }

    return NextResponse.json(await importCustomerContacts({
      adapter,
      clientId: targetClientId,
      importId,
      rows: rows as CustomerRow[],
    }));
  }

  const errors: string[] = [];
  let imported = 0;
  // R2: filas que no pueden producir un documento editable desde el CRM.
  let rejected = 0;

  // Process in batches of 500
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (let j = 0; j < chunk.length; j++) {
      const row = chunk[j];
      const rowIdx = i + j + 1;

      try {
        if (type === "appointments") {
          // R2: la fila se normaliza para que nazca válida ante firestore.rules.
          // El docId se obtiene ANTES de escribir porque el email de relleno lo usa.
          const docRef = db.collection("appointments").doc();
          const outcome = normalizeAppointmentRow(row as AppointmentRow, clientId, docRef.id);
          if (!outcome.ok) {
            rejected++;
            errors.push(`Fila ${rowIdx}: ${outcome.reason}`);
            continue;
          }
          batch.set(docRef, { ...outcome.fields, createdAt: Timestamp.now() });
          imported++;
        }
      } catch (err) {
        errors.push(`Fila ${rowIdx}: ${err instanceof Error ? err.message : "error desconocido"}`);
      }
    }

    try {
      await batch.commit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error desconocido";
      errors.push(`Error al guardar batch ${Math.floor(i / BATCH_SIZE) + 1}: ${msg}`);
      imported -= chunk.length; // rollback count for failed batch
    }
  }

  return NextResponse.json({ imported, rejected, errors, total: rows.length });
});
