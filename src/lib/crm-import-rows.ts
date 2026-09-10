/**
 * Normalización de las filas del import CSV del CRM (tramo R2).
 *
 * El endpoint `/api/crm/import` escribe con el Admin SDK, así que **no pasa por
 * las firestore.rules** del template. Hasta ahora ponía `null` en tres campos
 * cuando la fila del CSV no los traía, y eso producía citas que el dueño no podía
 * ni cancelar desde su CRM: la regla `appointments.update` revalida el documento
 * completo con `isValidAppointment`, que exige un email válido, un teléfono de 5 a
 * 20 caracteres y un `staffId` de tipo string. Medido en el proyecto aislado, con
 * un documento por campo: los tres deniegan por separado. Su única salida era
 * borrar la cita, es decir destruir el histórico recién importado.
 *
 * Aquí las filas nacen válidas:
 *  · email ausente    -> `import_<docId>@noemail.local`, la misma convención que
 *                        el template usa en `CustomersTab` con `walkin_…` y en el
 *                        saneo de `updateAppointment`. El id del documento la hace
 *                        determinista y trazable.
 *  · staffId ausente  -> `""`. La regla pide `is string`; la cadena vacía la
 *                        satisface sin inventar un miembro del personal.
 *  · teléfono ausente -> **la fila se RECHAZA** y se reporta con su número y su
 *                        motivo (decisión de Liam, D-20 a). No hay valor vacío
 *                        válido para ese campo, y un teléfono inventado es un dato
 *                        de negocio falso. Que la fila no entre es la señal que el
 *                        dueño necesita ver.
 *
 * Módulo aparte y sin dependencias de Next ni de Firebase, para que la
 * normalización y el reporte por fila se puedan medir sin levantar el endpoint ni
 * usar credenciales.
 */

/** Placeholder de email para filas sin dirección. Debe casar con el saneo del template. */
export function importPlaceholderEmail(docId: string): string {
  return `import_${docId}@noemail.local`;
}

export interface AppointmentRowInput {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceId?: string;
  staffId?: string;
  date?: string;
  time?: string;
  duration?: number;
  status?: string;
  paymentStatus?: string;
  amountPaidCents?: number;
}

export type NormalizedAppointment = {
  clientId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  paymentStatus: string | null;
  amountPaidCents: number | null;
};

export type RowOutcome =
  | { ok: true; fields: NormalizedAppointment }
  | { ok: false; reason: string };

/** El mismo mínimo que exige `isValidAppointment` en firestore.rules. */
const TELEFONO_MINIMO = 5;
const TELEFONO_MAXIMO = 20;

/**
 * Normaliza una fila de citas. Devuelve `ok: false` con el motivo cuando la fila no
 * puede producir un documento que el CRM sea capaz de editar.
 */
export function normalizeAppointmentRow(
  row: AppointmentRowInput,
  clientId: string,
  docId: string,
): RowOutcome {
  const nombre = (row.customerName ?? "").trim();
  const servicio = (row.serviceId ?? "").trim();
  const fecha = (row.date ?? "").trim();
  const hora = (row.time ?? "").trim();
  if (!nombre || !servicio || !fecha || !hora) {
    return { ok: false, reason: "customerName, date, time y serviceId son obligatorios" };
  }

  const telefono = (row.customerPhone ?? "").trim();
  if (!telefono) {
    return {
      ok: false,
      reason:
        "customerPhone vacio: sin telefono la cita no se puede editar ni cancelar desde el CRM " +
        "(firestore.rules exige entre 5 y 20 caracteres). Completa la columna y reimporta la fila.",
    };
  }
  if (telefono.length < TELEFONO_MINIMO || telefono.length > TELEFONO_MAXIMO) {
    return {
      ok: false,
      reason: `customerPhone de ${telefono.length} caracteres: firestore.rules admite entre ${TELEFONO_MINIMO} y ${TELEFONO_MAXIMO}`,
    };
  }

  const emailCrudo = (row.customerEmail ?? "").trim().toLowerCase();
  const email = emailCrudo || importPlaceholderEmail(docId);

  return {
    ok: true,
    fields: {
      clientId,
      customerName: nombre,
      customerEmail: email,
      customerPhone: telefono,
      serviceId: servicio,
      staffId: (row.staffId ?? "").trim(),
      date: fecha,
      time: hora,
      duration: row.duration ?? 30,
      status: row.status || "completed",
      paymentStatus: row.paymentStatus || null,
      amountPaidCents: row.amountPaidCents ?? null,
    },
  };
}
