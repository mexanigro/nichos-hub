import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;
const BATCH_SIZE = 500;

/** djb2 hash — must match master-template's simpleHash for deterministic doc IDs. */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

interface CustomerRow {
  fullName: string;
  email?: string;
  phone?: string;
  tags?: string;
  notes?: string;
  source?: string;
  visitCount?: number;
  preferences?: string;
  paymentMethod?: string;
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
  const { clientId, type, rows } = body as {
    clientId: string;
    type: "customers" | "appointments";
    rows: ImportRow[];
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

  const errors: string[] = [];
  let imported = 0;

  // Process in batches of 500
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (let j = 0; j < chunk.length; j++) {
      const row = chunk[j];
      const rowIdx = i + j + 1;

      try {
        if (type === "customers") {
          const c = row as CustomerRow;
          if (!c.fullName?.trim()) {
            errors.push(`Fila ${rowIdx}: fullName requerido`);
            continue;
          }

          const email = (c.email || "").trim().toLowerCase();
          const docId = email
            ? `${clientId}_${simpleHash(email)}`
            : `${clientId}_${simpleHash(c.fullName.trim() + (c.phone || ""))}`;

          const now = Timestamp.now();
          batch.set(
            db.collection("customers").doc(docId),
            {
              clientId,
              fullName: c.fullName.trim(),
              email: email || null,
              phone: (c.phone || "").trim() || null,
              tags: c.tags ? c.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
              notes: (c.notes || "").trim() || null,
              preferences: c.preferences ? c.preferences.split(",").map((p) => p.trim()).filter(Boolean) : [],
              source: "import",
              visitCount: c.visitCount ?? 0,
              paymentMethod: c.paymentMethod || null,
              createdAt: now,
              updatedAt: now,
            },
            { merge: true },
          );
          imported++;
        } else {
          const a = row as AppointmentRow;
          if (!a.customerName?.trim() || !a.date || !a.time || !a.serviceId) {
            errors.push(`Fila ${rowIdx}: customerName, date, time, serviceId requeridos`);
            continue;
          }

          const docRef = db.collection("appointments").doc();
          batch.set(docRef, {
            clientId,
            customerName: a.customerName.trim(),
            customerEmail: (a.customerEmail || "").trim().toLowerCase() || null,
            customerPhone: (a.customerPhone || "").trim() || null,
            serviceId: a.serviceId.trim(),
            staffId: (a.staffId || "").trim() || null,
            date: a.date.trim(),
            time: a.time.trim(),
            duration: a.duration ?? 30,
            status: a.status || "completed",
            paymentStatus: a.paymentStatus || null,
            amountPaidCents: a.amountPaidCents ?? null,
            createdAt: Timestamp.now(),
          });
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

  return NextResponse.json({ imported, errors, total: rows.length });
});
