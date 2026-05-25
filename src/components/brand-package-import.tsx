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
  setNestedValue,
  ROLE_META,
  type ParsedBrandPackage,
  type MappedImage,
  type ImageRole,
  type DetectionMethod,
} from "@/lib/brand-package-parser";

/* ═══════════════════════════════════════════════════════════════════════════
 * Types
 * ═══════════════════════════════════════════════════════════════════════════ */

type Stage = "idle" | "parsing" | "preview" | "uploading" | "done";

interface BrandPackageImportProps {
  clientId: string;
  onBrandApplied: (config: Record<string, unknown>) => void;
}

const ALL_ROLES = Object.keys(ROLE_META) as ImageRole[];

const COLOR_DESCRIPTIONS: Record<string, string> = {
  accent: "Botones, links, acentos",
  accentLight: "Hover, highlights, badges",
  surfaceDark: "Fondos oscuros, header, footer",
};

const DETECTION_BADGES: Record<DetectionMethod, { icon: string; label: string }> = {
  filename: { icon: "🏷️", label: "Nombre" },
  json: { icon: "📄", label: "JSON" },
  dimensions: { icon: "📐", label: "Dimensiones" },
  manual: { icon: "✏️", label: "Manual" },
};

const GROUP_LABELS: Record<string, string> = {
  branding: "Branding",
  contenido: "Contenido",
  galeria: "Galeria y servicios",
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
  const [editedTypography, setEditedTypography] = useState<{ display: string; body: string }>({ display: "", body: "" });
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
      setEditedTypography({
        display: result.typography?.display || "",
        body: result.typography?.body || "",
      });
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
      // For single-image roles: if another image already has this role, unset it
      if (newRole && !ROLE_META[newRole].isArray) {
        const existing = images.findIndex((img, i) => i !== index && img.role === newRole);
        if (existing >= 0) {
          images[existing] = { ...images[existing], role: null, detectedBy: undefined };
        }
      }
      images[index] = { ...images[index], role: newRole, detectedBy: newRole ? "manual" : undefined };
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

    // Track uploaded URLs — array roles can have multiple entries
    const uploadedByRole: Record<string, string[]> = {};

    for (let i = 0; i < toUpload.length; i++) {
      const img = toUpload[i];
      try {
        const form = new FormData();
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
        let res: Response;
        try {
          res = await fetch(`/api/upload/${clientId}`, { method: "POST", body: form });
        } catch (fetchErr) {
          const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          setError(`Error de conexion subiendo ${img.filename}: ${msg}`);
          setStage("preview");
          return;
        }

        let data: { urls?: string[]; errors?: string[]; error?: string } = {};
        try {
          data = await res.json();
        } catch {
          setError(`Error subiendo ${img.filename}: HTTP ${res.status} — el servidor devolvio una respuesta inesperada`);
          setStage("preview");
          return;
        }

        if (!res.ok) {
          setError(`Error subiendo ${img.filename}: ${data.error || `HTTP ${res.status}`}`);
          setStage("preview");
          return;
        }

        if (data.urls?.[0] && img.role) {
          if (!uploadedByRole[img.role]) uploadedByRole[img.role] = [];
          uploadedByRole[img.role].push(data.urls[0]);
        }
      } catch (unexpectedErr) {
        const msg = unexpectedErr instanceof Error ? unexpectedErr.message : String(unexpectedErr);
        setError(`Error inesperado subiendo ${img.filename}: ${msg}`);
        setStage("preview");
        return;
      }

      setUploadProgress({ done: i + 1, total: toUpload.length });
    }

    // Build config patch using ROLE_META paths
    const configPatch: Record<string, unknown> = {
      brand: { name: editedName },
      theme: {
        accent: editedColors.accent,
        accentLight: editedColors.accentLight,
        surfaceDark: editedColors.surfaceDark,
      },
    };

    // Typography
    if (editedTypography.display || editedTypography.body) {
      configPatch.typography = {
        ...(editedTypography.display && { display: editedTypography.display }),
        ...(editedTypography.body && { body: editedTypography.body }),
      };
    }

    // Map uploaded images to config paths
    for (const [role, urls] of Object.entries(uploadedByRole)) {
      const meta = ROLE_META[role as ImageRole];
      if (!meta) continue;

      if (meta.isArray) {
        // Array roles: build array value
        if (role === "galleryImage") {
          setNestedValue(configPatch, meta.configPath, urls.map((u) => ({ src: u, alt: "" })));
        } else {
          setNestedValue(configPatch, meta.configPath, urls);
        }
      } else {
        // Single-image roles: use first URL
        setNestedValue(configPatch, meta.configPath, urls[0]);
      }
    }

    onBrandApplied(configPatch);
    setStage("done");
  }, [parsed, clientId, editedName, editedColors, editedTypography, onBrandApplied]);

  /* ── Reset ──────────────────────────────────────────────────────────── */

  const handleReset = useCallback(() => {
    if (parsed) cleanupPreviews(parsed.images);
    setParsed(null);
    setStage("idle");
    setError("");
    setEditedName("");
    setEditedColors({ accent: "", accentLight: "", surfaceDark: "" });
    setEditedTypography({ display: "", body: "" });
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

          {/* Warning: colors from image */}
          {parsed.colorsFromImage && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
              <span className="mt-0.5 text-amber-400">⚠</span>
              <p className="text-[11px] text-amber-300/90">
                No se encontro JSON/CSS de colores — extraidos de imagenes. Revisar asignacion.
              </p>
            </div>
          )}

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
                    <p className="text-[9px] text-text-muted/60">{COLOR_DESCRIPTIONS[key]}</p>
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
                    : "Paleta detectada — click un slot arriba para reasignar"
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

          {/* Typography (editable) */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold text-text-secondary">
              <Type size={10} className="mr-1 inline" />
              Tipografia
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <p className="mb-1 text-[10px] font-medium text-text-muted">Display / Titulos</p>
                <input
                  className="w-full bg-transparent text-[11px] text-text outline-none placeholder:text-text-muted/40"
                  value={editedTypography.display}
                  onChange={(e) => setEditedTypography((prev) => ({ ...prev, display: e.target.value }))}
                  placeholder="Ej: Playfair Display"
                />
              </div>
              <div className="rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <p className="mb-1 text-[10px] font-medium text-text-muted">Body / Texto</p>
                <input
                  className="w-full bg-transparent text-[11px] text-text outline-none placeholder:text-text-muted/40"
                  value={editedTypography.body}
                  onChange={(e) => setEditedTypography((prev) => ({ ...prev, body: e.target.value }))}
                  placeholder="Ej: Inter"
                />
              </div>
            </div>
          </div>

          {/* Images — grouped by role category */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold text-text-secondary">
              <ImageIcon size={10} className="mr-1 inline" />
              Imagenes ({parsed.images.filter((i) => i.role).length}/{parsed.images.length} asignadas)
            </label>

            {(["branding", "contenido", "galeria"] as const).map((group) => {
              const groupImages = parsed.images
                .map((img, i) => ({ img, originalIndex: i }))
                .filter(({ img }) => img.role && ROLE_META[img.role]?.group === group);

              // Also include unassigned images in the last group
              const unassigned = group === "galeria"
                ? parsed.images
                    .map((img, i) => ({ img, originalIndex: i }))
                    .filter(({ img }) => !img.role && !/board|guidelines|suite|reference|original/i.test(img.filename))
                : [];

              const items = [...groupImages, ...unassigned];
              if (items.length === 0) return null;

              return (
                <div key={group} className="mt-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted/70">
                    {GROUP_LABELS[group]}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map(({ img, originalIndex }) => {
                      const isSkipped = img.role === null && /board|guidelines|suite|reference|original/i.test(img.filename);
                      return (
                        <div
                          key={originalIndex}
                          className={`group/card rounded-lg border transition-all ${
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
                            {/* Detection badge */}
                            {img.detectedBy && img.detectedBy !== "manual" && (
                              <span className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] text-white/80" title={`Detectado por: ${DETECTION_BADGES[img.detectedBy].label}`}>
                                {DETECTION_BADGES[img.detectedBy].icon} {DETECTION_BADGES[img.detectedBy].label}
                              </span>
                            )}
                            {/* Dimensions */}
                            {img.width && img.height && (
                              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[8px] text-white/60">
                                {img.width}×{img.height}
                              </span>
                            )}
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="truncate text-[9px] text-text-muted" title={img.filename}>
                              {img.filename}
                            </p>
                            <select
                              value={img.role || "none"}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateImageRole(originalIndex, val === "none" ? null : val as ImageRole);
                              }}
                              className="mt-1 w-full rounded border border-border bg-bg-input px-1.5 py-1 text-[10px] text-text outline-none focus:border-accent"
                            >
                              <option value="none">Sin asignar</option>
                              <optgroup label="Branding">
                                {ALL_ROLES.filter((r) => ROLE_META[r].group === "branding").map((r) => (
                                  <option key={r} value={r}>{ROLE_META[r].label}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Contenido">
                                {ALL_ROLES.filter((r) => ROLE_META[r].group === "contenido").map((r) => (
                                  <option key={r} value={r}>{ROLE_META[r].label}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Galeria">
                                {ALL_ROLES.filter((r) => ROLE_META[r].group === "galeria").map((r) => (
                                  <option key={r} value={r}>{ROLE_META[r].label}</option>
                                ))}
                              </optgroup>
                            </select>
                            {img.role && (
                              <p className="mt-0.5 text-[8px] text-text-muted/60">
                                {ROLE_META[img.role].description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Skipped images */}
            {parsed.images.some((img) => /board|guidelines|suite|reference|original/i.test(img.filename)) && (
              <p className="mt-2 text-[9px] text-text-muted/50">
                Omitidas: {parsed.images.filter((img) => /board|guidelines|suite|reference|original/i.test(img.filename)).length} imagenes de referencia/guidelines
              </p>
            )}
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
