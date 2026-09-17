import {
  CoreContactAdapterError,
  type CoreContactCreate,
  type CoreContactReceipt,
  type CoreContactSummary,
} from "./core-contact-adapter.ts";

export const CORE_CONTACT_ENTRY_POINTS = {
  import: "hub-import-contacts",
  book: "hub-book-contact",
  stats: "hub-crm-stats",
} as const;

export type CoreContactShellAdapter = {
  assertScope(clientId: string, entryPoint: string): void;
  create(command: CoreContactCreate): Promise<CoreContactReceipt>;
  summary(clientId: string, entryPoint: string): Promise<CoreContactSummary>;
};

export type CustomerImportRow = {
  fullName: string;
  email?: string;
  phone?: string;
  tags?: string;
  notes?: string;
};

export type ContactImportResult = {
  imported: number;
  rejected: number;
  errors: string[];
  total: number;
};

export async function importCustomerContacts(input: {
  adapter: CoreContactShellAdapter;
  clientId: string;
  importId: string;
  rows: CustomerImportRow[];
}): Promise<ContactImportResult> {
  const { adapter, clientId, importId, rows } = input;
  adapter.assertScope(clientId, CORE_CONTACT_ENTRY_POINTS.import);

  const errors: string[] = [];
  let imported = 0;
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const rowNumber = index + 1;
    if (!row.fullName?.trim()) {
      errors.push(`Fila ${rowNumber}: fullName requerido`);
      continue;
    }
    try {
      await adapter.create({
        operationId: `hub-import-${importId}-${rowNumber}`,
        clientId,
        entryPoint: CORE_CONTACT_ENTRY_POINTS.import,
        fields: {
          fullName: row.fullName.trim(),
          email: (row.email ?? "").trim().toLowerCase() || null,
          phone: (row.phone ?? "").trim() || null,
          channel: "import",
          notes: (row.notes ?? "").trim(),
          tags: row.tags ? row.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
        },
      });
      imported++;
    } catch (error) {
      const code = error instanceof CoreContactAdapterError ? error.code : "contact_adapter_failed";
      errors.push(`Fila ${rowNumber}: ${code}`);
    }
  }

  return { imported, rejected: rows.length - imported, errors, total: rows.length };
}

export type BookedContactResult = {
  state: "confirmed" | "uncertain" | "rejected";
  operationId: string;
  key?: string;
  revision?: number;
  error?: string;
};

export async function recordBookedContact(input: {
  adapter: CoreContactShellAdapter;
  clientId: string;
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}): Promise<BookedContactResult> {
  const operationId = `hub-book-contact-${input.appointmentId}`;
  try {
    const receipt = await input.adapter.create({
      operationId,
      clientId: input.clientId,
      entryPoint: CORE_CONTACT_ENTRY_POINTS.book,
      fields: {
        fullName: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone,
        channel: "whatsapp",
      },
    });
    return { state: "confirmed", operationId, key: receipt.key, revision: receipt.revision };
  } catch (error) {
    const failure = error instanceof CoreContactAdapterError
      ? error
      : new CoreContactAdapterError(503, "contact_adapter_failed", true);
    return {
      state: failure.uncertain ? "uncertain" : "rejected",
      operationId,
      error: failure.code,
    };
  }
}

export function readContactSummary(
  adapter: CoreContactShellAdapter,
  clientId: string,
): Promise<CoreContactSummary> {
  adapter.assertScope(clientId, CORE_CONTACT_ENTRY_POINTS.stats);
  return adapter.summary(clientId, CORE_CONTACT_ENTRY_POINTS.stats);
}
