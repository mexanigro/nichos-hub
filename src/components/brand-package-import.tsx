"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  FolderOpen,
  Loader2,
  CheckCircle,
  Upload,
  Palette,
  Image as ImageIcon,
  Type,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  parseBrandPackage,
  cleanupPreviews,
  lightenHex,
  type ParsedBrandPackage,
  type MappedImage,
  type ImageRole,
} from "@/lib/brand-package-parser";

/* ═══════════════════════════════════════════════════════════════════════════
 * Types
 * ═══════════════════════════════════════════════════════════════════════════ */

type Stage = "idle" | "parsing" | "preview" | "uploading" | "done";

interface BrandPackageImportProps {
  clientId: string;
  onBrandApplied: (config: Record<string, unknown>) => void;
}

const ROLE_LABELS: Record<ImageRole | "none", string> = {
  logo: "Logo (fondo claro)",
  logoDark: "Logo (fondo oscuro)",
  ogImage: "OG Image",
  favicon: "Favicon",
  none: "Sin asignar",
};

/* ═══════════════════════════════════════════════════════════════════════════
 * Folder drop helpers
 * ═══════════════════════════════════════════════════════════════════════════ */

async function readEntryAsFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

async function readDirectoryEntries(dir: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    dir.createReader().readEntries(resolve, reject);
  });
}

async function collectFilesFromEntries(entries: FileSystemEntry[]): Promise<File[]> {
  const files: File[] = [];

  for (const entry of entries) {
    if (entry.isFile) {
      try {
        files.push(await readEntryAsFile(entry as FileSystemFileEntry));
      } catch { /* skip unreadable */ }
    } else if (entry.isDirectory) {
      const children = await readDirectoryEntries(entry as FileSystemDirectoryEntry);
      const nested = await collectFilesFromEntries(children);
      files.push(...nested);
    }
  }

  return files;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Component
 * ═══════════════════════════════════════════════════════════════════════════ */

export function BrandPackageImport({ clientId, onBrandApplied }: BrandPackageImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<ParsedBrandPackage | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedColors, setEditedColors] = useState({ accent: "", accentLight: "", surfaceDark: "" });
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [error, setError] = useState("");

  // Cleanup Object URLs on unmount
  useEffect(() => {
    return () => {
      if (parsed) cleanupPreviews(parsed.images);
    };
  }, [parsed]);

  /* ── File collection ────────────────────────────────────────────────── */

  const processFiles = useCallback(async (files: File[]) => {
    setError("");
    setStage("parsing");

    try {
      const result = await parseBrandPackage(files);
      setParsed(result);
      setEditedName(result.brandName);
      setEditedColors({ ...result.colors });
      setStage("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al parsear el brand package");
      setStage("idle");
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const items = Array.from(e.dataTransfer.items);
    const entries: FileSystemEntry[] = [];

    for (const item of items) {
      const entry = item.webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }

    if (entries.length > 0) {
      const files = await collectFilesFromEntries(entries);
      if (files.length > 0) {
        processFiles(files);
        return;
      }
    }

    // Fallback: plain file drop
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }, [processFiles]);

  /* ── Image role change ──────────────────────────────────────────────── */

  const updateImageRole = useCallback((index: number, newRole: ImageRole | null) => {
    if (!parsed) return;
    setParsed((prev) => {
      if (!prev) return prev;
      const images = [...prev.images];
      // If another image already has this role, unset it
      if (newRole) {
        const existing = images.findIndex((img, i) => i !== index && img.role === newRole);
        if (existing >= 0) {
          images[existing] = { ...images[existing], role: null };
        }
      }
      images[index] = { ...images[index], role: newRole };
      return { ...prev, images };
    });
  }, [parsed]);

  /* ── Color swatch click ─────────────────────────────────────────────── */

  const [colorTarget, setColorTarget] = useState<keyof typeof editedColors | null>(null);

  const handleSwatchClick = useCallback((hex: string) => {
    if (!colorTarget) return;
    setEditedColors((prev) => ({ ...prev, [colorTarget]: hex }));
    setColorTarget(null);
  }, [colorTarget]);

  /* ── Apply (upload + config) ────────────────────────────────────────── */

  const handleApply = useCallback(async () => {
    if (!parsed) return;
    setStage("uploading");
    setError("");

    const toUpload = parsed.images.filter((img) => img.role !== null);
    setUploadProgress({ done: 0, total: toUpload.length });

    const uploadedUrls: Partial<Record<ImageRole, string>> = {};

    for (let i = 0; i < toUpload.length; i++) {
      const img = toUpload[i];
      try {
        const form = new FormData();
        // Re-create the File with a proper MIME type if it's empty (common on
        // Windows when files come from webkitGetAsEntry).
        let fileToUpload = img.file;
        if (!fileToUpload.type) {
          const ext = img.filename.slice(img.filename.lastIndexOf(".")).toLowerCase();
          const mimeMap: Record<string, string> = {
            ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".webp": "image/webp", ".svg": "image/svg+xml", ".gif": "image/gif",
            ".avif": "image/avif", ".ico": "image/x-icon",
          };
          const mime = mimeMap[ext];
          if (mime) {
            fileToUpload = new File([fileToUpload], fileToUpload.name, { type: mime });
          }
        }
        form.append("file", fileToUpload);
        const res = await fetch(`/api/upload/${clientId}`, { method: "POST", body: form });
        const data = await res.json();

        if (!res.ok) {
          setError(`Error subiendo ${img.filename}: ${data.error || "Error desconocido"}`);
          setStage("preview");
          return;
        }

        if (data.urls?.[0] && img.role) {
          uploadedUrls[img.role] = data.urls[0];
        }
      } catch {
        setError(`Error de red subiendo ${img.filename}`);
        setStage("preview");
        return;
      }

      setUploadProgress({ done: i + 1, total: toUpload.length });
    }

    // Build config partial
    const brandPatch: Record<string, unknown> = { name: editedName };
    if (uploadedUrls.logo) brandPatch.logo = uploadedUrls.logo;
    if (uploadedUrls.logoDark) brandPatch.logoDark = uploadedUrls.logoDark;
    if (uploadedUrls.ogImage) brandPatch.ogImage = uploadedUrls.ogImage;
    if (uploadedUrls.favicon) brandPatch.favicon = uploadedUrls.favicon;

    const configPatch: Record<string, unknown> = {
      brand: brandPatch,
      theme: {
        accent: editedColors.accent,
        accentLight: editedColors.accentLight,
        surfaceDark: editedColors.surfaceDark,
      },
    };

    onBrandApplied(configPatch);
    setStage("done");
  }, [parsed, clientId, editedName, editedColors, onBrandApplied]);

  /* ── Reset ──────────────────────────────────────────────────────────── */

  const handleReset = useCallback(() => {
    if (parsed) cleanupPreviews(parsed.images);
    setParsed(null);
    setStage("idle");
    setError("");
    setEditedName("");
    setEditedColors({ accent: "", accentLight: "", surfaceDark: "" });
    setUploadProgress({ done: 0, total: 0 });
    setColorTarget(null);
  }, [parsed]);

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-3">
      {/* ── Idle: drop zone ────────────────────────────────────────── */}
      {stage === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200 ${
            dragOver
              ? "border-accent bg-accent/10 scale-[1.01]"
              : "border-border hover:border-accent/40 hover:bg-bg-hover"
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
            dragOver ? "bg-accent/20" : "bg-bg-elevated"
          }`}>
            <FolderOpen size={22} className={dragOver ? "text-accent" : "text-text-muted"} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-text">
              Arrastra tu carpeta de brand package
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              JSON de colores + logos + OG image. Se detecta todo automaticamente.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            /* @ts-expect-error webkitdirectory is not in React types */
            webkitdirectory=""
            onChange={handleFolderSelect}
          />
        </div>
      )}

      {/* ── Parsing spinner ────────────────────────────────────────── */}
      {stage === "parsing" && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-bg-elevated px-6 py-10">
          <Loader2 size={20} className="animate-spin text-accent" />
          <p className="text-sm text-text-muted">Analizando brand package...</p>
        </div>
      )}

      {/* ── Preview ────────────────────────────────────────────────── */}
      {stage === "preview" && parsed && (
        <div className="space-y-4 rounded-xl border border-border bg-bg-card p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <span className="text-xs font-semibold text-text">Brand package detectado</span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
            >
              <RotateCcw size={10} /> Resetear
            </button>
          </div>

          {/* Brand name */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-text-secondary">
              <Type size={10} className="mr-1 inline" />
              Nombre del negocio
            </label>
            <input
              className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text outline-none focus:border-accent"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
            />
          </div>

          {/* Colors */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold text-text-secondary">
              <Palette size={10} className="mr-1 inline" />
              Colores del tema
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["accent", "accentLight", "surfaceDark"] as const).map((key) => (
                <div key={key} className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setColorTarget(colorTarget === key ? null : key)}
                    className={`h-7 w-7 shrink-0 rounded-md border-2 transition-all ${
                      colorTarget === key ? "border-accent ring-2 ring-accent/30" : "border-border"
                    }`}
                    style={{ backgroundColor: editedColors[key] }}
                    title="Click para reasignar desde paleta"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-text-muted">
                      {key === "accent" ? "Accent" : key === "accentLight" ? "Accent Light" : "Surface Dark"}
                    </p>
                    <input
                      className="w-full bg-transparent text-[11px] font-mono text-text outline-none"
                      value={editedColors[key]}
                      onChange={(e) => setEditedColors((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Color palette swatches */}
            {Object.keys(parsed.allColors).length > 0 && (
              <div className="mt-2">
                <p className="mb-1.5 text-[10px] text-text-muted">
                  {colorTarget
                    ? `Click un color para asignarlo a "${colorTarget === "accent" ? "Accent" : colorTarget === "accentLight" ? "Accent Light" : "Surface Dark"}"`
                    : "Paleta completa del JSON — click un slot arriba para reasignar"
                  }
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(parsed.allColors).map(([name, hex]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => colorTarget && handleSwatchClick(hex)}
                      disabled={!colorTarget}
                      className={`group relative flex items-center gap-1.5 rounded-md border px-2 py-1 transition-all ${
                        colorTarget
                          ? "border-border cursor-pointer hover:border-accent hover:bg-accent/5"
                          : "border-border/50 cursor-default opacity-70"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded border border-black/10"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-[9px] text-text-muted">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Typography (informational) */}
          {parsed.typography && (
            <div className="rounded-lg bg-bg-elevated px-3 py-2">
              <p className="text-[10px] text-text-muted">
                <Type size={9} className="mr-1 inline" />
                Tipografia: <span className="font-medium text-text-secondary">{parsed.typography.display || "—"}</span> (display) / <span className="font-medium text-text-secondary">{parsed.typography.body || "—"}</span> (body)
              </p>
            </div>
          )}

          {/* Images */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold text-text-secondary">
              <ImageIcon size={10} className="mr-1 inline" />
              Imagenes detectadas
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {parsed.images.map((img, i) => {
                const isSkipped = img.role === null && /board|guidelines|suite|reference|original/i.test(img.filename);
                return (
                  <div
                    key={i}
                    className={`group rounded-lg border transition-all ${
                      isSkipped
                        ? "border-border/30 opacity-40"
                        : img.role
                          ? "border-accent/30 bg-accent/5"
                          : "border-border bg-bg-elevated"
                    }`}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-t-lg bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)_0_0/16px_16px]">
                      <img
                        src={img.previewUrl}
                        alt={img.filename}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="truncate text-[9px] text-text-muted" title={img.filename}>
                        {img.filename}
                      </p>
                      <select
                        value={img.role || "none"}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateImageRole(i, val === "none" ? null : val as ImageRole);
                        }}
                        className="mt-1 w-full rounded border border-border bg-bg-input px-1.5 py-1 text-[10px] text-text outline-none focus:border-accent"
                      >
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini preview */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold text-text-muted">Vista previa</p>
            <div
              className="flex items-center gap-3 rounded-xl border border-border p-3"
              style={{ backgroundColor: editedColors.surfaceDark }}
            >
              {/* Logo dark preview */}
              {parsed.images.find((img) => img.role === "logoDark") ? (
                <img
                  src={parsed.images.find((img) => img.role === "logoDark")!.previewUrl}
                  alt="Logo dark"
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div className="flex h-10 items-center px-2 text-xs font-semibold" style={{ color: editedColors.accent }}>
                  {editedName}
                </div>
              )}
              <div className="flex-1" />
              <div className="flex gap-1.5">
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: editedColors.accent }}
                  title="Accent"
                />
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: editedColors.accentLight }}
                  title="Accent Light"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
          )}

          {/* Apply button */}
          <button
            onClick={handleApply}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-hover active:scale-[0.98]"
          >
            <Upload size={16} />
            Aplicar Brand Package
          </button>
        </div>
      )}

      {/* ── Uploading ──────────────────────────────────────────────── */}
      {stage === "uploading" && (
        <div className="space-y-3 rounded-xl border border-border bg-bg-card p-6">
          <div className="flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-accent" />
            <div>
              <p className="text-sm font-medium text-text">Subiendo imagenes...</p>
              <p className="text-[11px] text-text-muted">
                {uploadProgress.done} de {uploadProgress.total} archivos
              </p>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Done ───────────────────────────────────────────────────── */}
      {stage === "done" && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
          <CheckCircle size={18} className="text-green-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-400">Brand package aplicado</p>
            <p className="text-[11px] text-text-muted">
              Los valores se cargaron en el formulario. Hace click en "Guardar" para persistir en Firestore.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-medium text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
          >
            Subir otro
          </button>
        </div>
      )}
    </div>
  );
}
