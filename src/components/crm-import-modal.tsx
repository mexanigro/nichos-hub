"use client";

import { useState, useCallback, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  MessageSquareText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import Papa from "papaparse";

/* ══════════════════════════════════════════════════════════════════════════
 * Types
 * ══════════════════════════════════════════════════════════════════════════ */

type ImportType = "customers" | "appointments";
type ImportMode = "csv" | "text";
type Step = "upload" | "map" | "preview" | "importing" | "done";

interface ImportResult {
  imported: number;
  errors: string[];
  total: number;
}

const CUSTOMER_FIELDS = [
  { value: "", label: "— Ignorar —" },
  { value: "fullName", label: "Nombre completo *" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefono" },
  { value: "tags", label: "Tags (separados por coma)" },
  { value: "notes", label: "Notas" },
  { value: "visitCount", label: "Cant. visitas" },
  { value: "paymentMethod", label: "Metodo de pago" },
  { value: "preferences", label: "Preferencias" },
] as const;

const APPOINTMENT_FIELDS = [
  { value: "", label: "— Ignorar —" },
  { value: "customerName", label: "Nombre cliente *" },
  { value: "customerEmail", label: "Email cliente" },
  { value: "customerPhone", label: "Telefono cliente" },
  { value: "serviceId", label: "Servicio (ID) *" },
  { value: "staffId", label: "Staff (ID)" },
  { value: "date", label: "Fecha (YYYY-MM-DD) *" },
  { value: "time", label: "Hora (HH:mm) *" },
  { value: "duration", label: "Duracion (min)" },
  { value: "status", label: "Estado" },
  { value: "amountPaidCents", label: "Monto pagado (centavos)" },
] as const;

/* ══════════════════════════════════════════════════════════════════════════
 * Component
 * ══════════════════════════════════════════════════════════════════════════ */

export function CrmImportModal({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const [importType, setImportType] = useState<ImportType>("customers");
  const [mode, setMode] = useState<ImportMode>("csv");
  const [step, setStep] = useState<Step>("upload");

  // CSV state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text state
  const [freeText, setFreeText] = useState("");
  const [aiParsing, setAiParsing] = useState(false);

  // Shared state
  const [mappedRows, setMappedRows] = useState<Record<string, unknown>[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const fields = importType === "customers" ? CUSTOMER_FIELDS : APPOINTMENT_FIELDS;

  /* ── CSV handling ────────────────────────────────────────────────────── */
  const handleFile = useCallback((file: File) => {
    setError("");
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length < 2) {
          setError("El archivo necesita al menos una fila de encabezados y una de datos");
          return;
        }
        setCsvHeaders(data[0]);
        setCsvData(data.slice(1));

        // Auto-map columns by fuzzy matching header names
        const autoMap: Record<number, string> = {};
        const headerLower = data[0].map((h) => h.toLowerCase().trim());
        const fieldValues = fields.map((f) => f.value).filter(Boolean);

        for (let i = 0; i < headerLower.length; i++) {
          const h = headerLower[i];
          for (const fv of fieldValues) {
            if (
              h === fv.toLowerCase() ||
              h.includes(fv.toLowerCase()) ||
              (fv === "fullName" && (h.includes("nombre") || h.includes("name"))) ||
              (fv === "customerName" && (h.includes("nombre") || h.includes("name") || h.includes("cliente"))) ||
              (fv === "email" && h.includes("email")) ||
              (fv === "phone" && (h.includes("tel") || h.includes("phone") || h.includes("celular"))) ||
              (fv === "date" && (h.includes("fecha") || h.includes("date"))) ||
              (fv === "time" && (h.includes("hora") || h.includes("time"))) ||
              (fv === "serviceId" && (h.includes("servicio") || h.includes("service"))) ||
              (fv === "staffId" && (h.includes("staff") || h.includes("profesional") || h.includes("barbero"))) ||
              (fv === "notes" && (h.includes("nota") || h.includes("note") || h.includes("comentario"))) ||
              (fv === "tags" && (h.includes("tag") || h.includes("etiqueta")))
            ) {
              if (!Object.values(autoMap).includes(fv)) {
                autoMap[i] = fv;
                break;
              }
            }
          }
        }
        setColumnMap(autoMap);
        setStep("map");
      },
      error: () => setError("Error al leer el archivo CSV"),
    });
  }, [fields]);

  function applyColumnMap() {
    const rows: Record<string, unknown>[] = [];
    for (const row of csvData) {
      const obj: Record<string, unknown> = {};
      let hasData = false;
      for (const [colIdx, field] of Object.entries(columnMap)) {
        if (!field) continue;
        const val = row[Number(colIdx)]?.trim();
        if (val) {
          obj[field] = field === "visitCount" || field === "duration" || field === "amountPaidCents"
            ? Number(val) || 0
            : val;
          hasData = true;
        }
      }
      if (hasData) rows.push(obj);
    }
    setMappedRows(rows);
    setStep("preview");
  }

  /* ── AI text parsing ─────────────────────────────────────────────────── */
  async function parseWithAI() {
    if (!freeText.trim()) return;
    setAiParsing(true);
    setError("");
    try {
      const res = await fetch("/api/crm/parse-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: freeText, targetType: importType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al analizar");
      if (!data.rows?.length) {
        setError("No se encontraron datos en el texto. Intenta con mas informacion.");
        return;
      }
      setMappedRows(data.rows);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar");
    } finally {
      setAiParsing(false);
    }
  }

  /* ── Import to Firestore ─────────────────────────────────────────────── */
  async function doImport() {
    setStep("importing");
    setError("");
    try {
      const res = await fetch("/api/crm/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, type: importType, rows: mappedRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      setResult(data);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
      setStep("preview");
    }
  }

  /* ── Edit row inline ─────────────────────────────────────────────────── */
  function updateRow(idx: number, field: string, value: string) {
    setMappedRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function deleteRow(idx: number) {
    setMappedRows((prev) => prev.filter((_, i) => i !== idx));
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  const activeFields = fields.filter((f) => f.value !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-text">Importar datos al CRM</h2>
            <p className="text-[11px] text-text-muted">
              {clientId} — {importType === "customers" ? "Clientes" : "Turnos"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* ── Step: Upload ───────────────────────────────────────────── */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-text-muted">Que queres importar?</label>
                <div className="flex gap-2">
                  {(["customers", "appointments"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setImportType(t)}
                      className={`rounded-lg border px-4 py-2 text-xs transition-colors ${
                        importType === t
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border bg-bg-elevated text-text-muted hover:text-text"
                      }`}
                    >
                      {t === "customers" ? "Clientes" : "Turnos / Citas"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode tabs */}
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-text-muted">Formato de los datos</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("csv")}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs transition-colors ${
                      mode === "csv"
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border bg-bg-elevated text-text-muted hover:text-text"
                    }`}
                  >
                    <FileSpreadsheet size={14} />
                    Archivo CSV
                  </button>
                  <button
                    onClick={() => setMode("text")}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs transition-colors ${
                      mode === "text"
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border bg-bg-elevated text-text-muted hover:text-text"
                    }`}
                  >
                    <MessageSquareText size={14} />
                    Texto libre (IA)
                  </button>
                </div>
              </div>

              {/* CSV upload */}
              {mode === "csv" && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 text-text-muted transition-colors hover:border-accent/50 hover:text-text"
                  >
                    <Upload size={28} />
                    <span className="text-xs">Arrastra un CSV o hace click para seleccionar</span>
                    <span className="text-[10px] text-text-muted">
                      Primera fila = encabezados. Separador: coma o punto y coma.
                    </span>
                  </button>
                </div>
              )}

              {/* Text input */}
              {mode === "text" && (
                <div className="space-y-3">
                  <textarea
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    rows={10}
                    placeholder={
                      importType === "customers"
                        ? "Pega aca los datos de clientes. Puede ser un export de WhatsApp, una lista, notas sueltas...\n\nEjemplo:\nDavid Cohen - 050-123-4567 - viene todos los viernes, prefiere fade bajo\nYossi Levi - yossi@gmail.com - 052-987-6543 - cliente VIP"
                        : "Pega aca los datos de turnos/citas. Puede ser un calendario, notas, chat...\n\nEjemplo:\n20/5 10:00 - David Cohen - corte con Alex\n20/5 14:00 - Avi Mizrahi - barba completa con Daniel, pago 150 en efectivo"
                    }
                    className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={parseWithAI}
                    disabled={aiParsing || !freeText.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                  >
                    {aiParsing ? <Loader2 size={14} className="animate-spin" /> : <MessageSquareText size={14} />}
                    {aiParsing ? "Analizando con IA..." : "Analizar con IA"}
                  </button>
                  <p className="text-[10px] text-text-muted">
                    La IA extraera nombres, telefonos, emails, fechas y servicios del texto.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step: Map columns (CSV only) ───────────────────────────── */}
          {step === "map" && (
            <div className="space-y-4">
              <p className="text-xs text-text-secondary">
                Mapea cada columna del CSV a un campo del CRM. Las columnas sin mapear se ignoran.
              </p>
              <div className="space-y-2">
                {csvHeaders.map((header, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-40 truncate rounded-md bg-bg-elevated px-2 py-1.5 text-xs text-text-secondary">
                      {header || `Columna ${i + 1}`}
                    </span>
                    <span className="text-[10px] text-text-muted">→</span>
                    <select
                      value={columnMap[i] || ""}
                      onChange={(e) => setColumnMap((prev) => ({ ...prev, [i]: e.target.value }))}
                      className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                    >
                      {fields.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStep("upload"); setCsvHeaders([]); setCsvData([]); setColumnMap({}); }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-text"
                >
                  Volver
                </button>
                <button
                  onClick={applyColumnMap}
                  disabled={!Object.values(columnMap).some(Boolean)}
                  className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
              <p className="text-[10px] text-text-muted">
                Preview: {csvData.length} filas detectadas. Mostrando primeras 3:
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border bg-bg-elevated">
                      {csvHeaders.map((h, i) => (
                        <th key={i} className="px-2 py-1.5 text-left font-medium text-text-muted">
                          {h || `Col ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1 text-text-secondary">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Step: Preview ──────────────────────────────────────────── */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">
                  {mappedRows.length} registros listos para importar. Podes editar o eliminar antes de confirmar.
                </p>
                <button
                  onClick={() => { setStep("upload"); setMappedRows([]); setError(""); }}
                  className="text-[11px] text-text-muted underline hover:text-text"
                >
                  Empezar de nuevo
                </button>
              </div>

              <div className="max-h-80 overflow-auto rounded-lg border border-border">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0">
                    <tr className="border-b border-border bg-bg-elevated">
                      <th className="px-2 py-1.5 text-left font-medium text-text-muted">#</th>
                      {activeFields.map((f) => (
                        <th key={f.value} className="px-2 py-1.5 text-left font-medium text-text-muted">
                          {f.label.replace(" *", "")}
                        </th>
                      ))}
                      <th className="px-2 py-1.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {mappedRows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-bg-elevated/50">
                        <td className="px-2 py-1 text-text-muted">{i + 1}</td>
                        {activeFields.map((f) => (
                          <td key={f.value} className="px-1 py-0.5">
                            <input
                              value={String(row[f.value] ?? "")}
                              onChange={(e) => updateRow(i, f.value, e.target.value)}
                              className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[11px] text-text focus:border-border focus:bg-bg-elevated focus:outline-none"
                            />
                          </td>
                        ))}
                        <td className="px-1 py-0.5">
                          <button
                            onClick={() => deleteRow(i)}
                            className="rounded p-1 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={doImport}
                disabled={mappedRows.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                <Upload size={14} />
                Importar {mappedRows.length} {importType === "customers" ? "clientes" : "turnos"}
              </button>
            </div>
          )}

          {/* ── Step: Importing ────────────────────────────────────────── */}
          {step === "importing" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 size={32} className="animate-spin text-accent" />
              <p className="text-xs text-text-secondary">Importando {mappedRows.length} registros...</p>
            </div>
          )}

          {/* ── Step: Done ─────────────────────────────────────────────── */}
          {step === "done" && result && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-3">
                <CheckCircle size={32} className="text-green-400" />
                <p className="text-sm font-semibold text-text">Importacion completada</p>
                <p className="text-xs text-text-secondary">
                  {result.imported} de {result.total} registros importados exitosamente
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="mb-2 text-[11px] font-medium text-amber-400">
                    {result.errors.length} advertencias:
                  </p>
                  <div className="max-h-32 space-y-0.5 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-[10px] text-amber-400/80">{e}</p>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
