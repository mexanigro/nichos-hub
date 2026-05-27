"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle, Loader2, Trash2, Upload } from "lucide-react";
import { validateTransparentPng } from "@/lib/png-validation";

/**
 * Single transparent-PNG upload field for the 3D Impact system.
 *
 * Runs `validateTransparentPng` before sending the file to `/api/upload`,
 * so bad assets (opaque PNGs, low-res images, oversized files) never reach
 * Firebase Storage. The dropzone uses a checkerboard background so the
 * uploaded PNG's transparency is visible at a glance.
 *
 * Kind drives the minimum resolution requirement:
 *   - "hero"     → hero objects (2400×3200+)
 *   - "layer"    → composition layers (same as hero)
 *   - "particle" → tiled particle/pearl textures (1200×1200+)
 */
export function TransparentPngUploader({
  label,
  hint,
  value,
  clientId,
  kind = "hero",
  onUploaded,
  onClear,
}: {
  label?: string;
  hint?: string;
  value: string | undefined;
  clientId: string;
  kind?: "hero" | "particle" | "layer";
  onUploaded: (url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handle = useCallback(
    async (file: File) => {
      setError(null);
      setWarning(null);
      const check = await validateTransparentPng(file, { kind });
      if (!check.ok) {
        setError(check.message);
        return;
      }
      if (check.warning) setWarning(check.warning);

      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", check.file);
        const res = await fetch(`/api/upload/${clientId}`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Error al subir");
          return;
        }
        if (data.urls?.[0]) onUploaded(data.urls[0]);
      } catch {
        setError("Error de red al subir");
      } finally {
        setUploading(false);
      }
    },
    [clientId, kind, onUploaded],
  );

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
          {hint && <span className="text-[10px] text-text-muted/70">{hint}</span>}
        </div>
      )}

      {value ? (
        <div className="relative">
          <div
            className="h-28 w-full rounded-md border border-border"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #1f1f23 25%, transparent 25%), linear-gradient(-45deg, #1f1f23 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1f1f23 75%), linear-gradient(-45deg, transparent 75%, #1f1f23 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
              backgroundColor: "#0a0a0d",
            }}
          >
            <img
              src={value}
              alt=""
              className="h-full w-full object-contain"
              onError={(e) => ((e.currentTarget.style.display = "none"))}
            />
          </div>
          <button
            type="button"
            onClick={onClear}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-red-500"
            title="Quitar imagen"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handle(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed px-4 py-6 transition-colors ${
            dragOver
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/50 hover:bg-bg-hover"
          }`}
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin text-accent" />
          ) : (
            <>
              <Upload size={18} className="text-text-muted" />
              <span className="text-[11px] text-text-muted">
                Arrastra o haz click — solo PNG con fondo transparente
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,.png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      {error && (
        <div className="flex items-start gap-1.5 rounded-md bg-red-500/10 px-2 py-1.5 text-[10px] text-red-400">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {warning && (
        <div className="flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-300">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}
