"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, Loader2, Sun, Moon } from "lucide-react";

interface LogoUploadFieldProps {
  clientId: string;
  logoLight: string;
  logoDark: string;
  onLogoChange: (logos: { logo?: string; logoDark?: string }) => void;
}

export function LogoUploadField({
  clientId,
  logoLight,
  logoDark,
  onLogoChange,
}: LogoUploadFieldProps) {
  const lightRef = useRef<HTMLInputElement>(null);
  const darkRef = useRef<HTMLInputElement>(null);
  const [uploadingLight, setUploadingLight] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);
  const [dragLight, setDragLight] = useState(false);
  const [dragDark, setDragDark] = useState(false);
  const [error, setError] = useState("");

  const upload = useCallback(
    async (file: File, variant: "light" | "dark") => {
      const setUploading = variant === "light" ? setUploadingLight : setUploadingDark;
      setError("");
      setUploading(true);
      try {
        const form = new FormData();
        form.append(variant === "light" ? "logo-light" : "logo-dark", file);
        const res = await fetch(`/api/upload-logo/${clientId}`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Error al subir logo");
          return;
        }
        const update: { logo?: string; logoDark?: string } = {};
        if (data.logo) update.logo = data.logo;
        if (data.logoDark) update.logoDark = data.logoDark;
        onLogoChange(update);
      } catch {
        setError("Error de red al subir logo");
      } finally {
        setUploading(false);
      }
    },
    [clientId, onLogoChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, variant: "light" | "dark") => {
      e.preventDefault();
      if (variant === "light") setDragLight(false);
      else setDragDark(false);
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) upload(file, variant);
      else setError("Solo se aceptan imagenes");
    },
    [upload],
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, variant: "light" | "dark") => {
      const file = e.target.files?.[0];
      if (file) upload(file, variant);
      e.target.value = "";
    },
    [upload],
  );

  const clearLogo = useCallback(
    (variant: "light" | "dark") => {
      if (variant === "light") onLogoChange({ logo: "" });
      else onLogoChange({ logoDark: "" });
    },
    [onLogoChange],
  );

  const isSameForBoth = logoLight && logoDark && logoLight === logoDark;

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Light variant */}
        <LogoZone
          label="Fondo claro"
          icon={<Sun size={12} />}
          value={logoLight}
          uploading={uploadingLight}
          dragOver={dragLight}
          bgClass="bg-white"
          onDragOver={() => setDragLight(true)}
          onDragLeave={() => setDragLight(false)}
          onDrop={(e) => handleDrop(e, "light")}
          onClick={() => lightRef.current?.click()}
          onClear={() => clearLogo("light")}
          badge={isSameForBoth ? "Mismo logo" : undefined}
        />

        {/* Dark variant */}
        <LogoZone
          label="Fondo oscuro"
          icon={<Moon size={12} />}
          value={logoDark}
          uploading={uploadingDark}
          dragOver={dragDark}
          bgClass="bg-[#111113]"
          onDragOver={() => setDragDark(true)}
          onDragLeave={() => setDragDark(false)}
          onDrop={(e) => handleDrop(e, "dark")}
          onClick={() => darkRef.current?.click()}
          onClear={() => clearLogo("dark")}
          badge={isSameForBoth ? "Mismo logo" : undefined}
        />
      </div>

      <input
        ref={lightRef}
        type="file"
        accept="image/png,image/svg+xml,image/webp,image/avif,image/jpeg"
        className="hidden"
        onChange={(e) => handleFile(e, "light")}
      />
      <input
        ref={darkRef}
        type="file"
        accept="image/png,image/svg+xml,image/webp,image/avif,image/jpeg"
        className="hidden"
        onChange={(e) => handleFile(e, "dark")}
      />

      {error && <p className="text-[10px] text-danger">{error}</p>}

      <p className="text-[10px] text-text-muted">
        SVG o PNG con fondo transparente. Si subis solo uno, se usa para ambos modos.
      </p>
    </div>
  );
}

/* ── Single logo upload zone ──────────────────────────────────────────── */

function LogoZone({
  label,
  icon,
  value,
  uploading,
  dragOver,
  bgClass,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onClear,
  badge,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  uploading: boolean;
  dragOver: boolean;
  bgClass: string;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onClear: () => void;
  badge?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
        {icon} {label}
      </p>

      {value ? (
        <div className="group relative">
          <div
            className={`flex items-center justify-center rounded-lg ${bgClass} p-4`}
            style={{ minHeight: 96 }}
          >
            <img
              src={value}
              alt={`Logo ${label}`}
              className="max-h-20 max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={onClick}
              className="rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-accent"
              title="Reemplazar"
            >
              <Upload size={11} />
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-danger"
              title="Quitar"
            >
              <X size={11} />
            </button>
          </div>

          {badge && (
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[9px] text-white/70">
              {badge}
            </span>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver();
          }}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onClick}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed transition-colors ${
            dragOver
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/50 hover:bg-bg-hover"
          }`}
          style={{ minHeight: 96 }}
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-accent" />
          ) : (
            <>
              <Upload size={18} className="text-text-muted" />
              <span className="text-[10px] text-text-muted">Subir o arrastrar</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Deferred logo picker for onboarding (no upload, stores Files locally) ── */

interface LogoPickerProps {
  lightFile: File | null;
  darkFile: File | null;
  lightPreview: string;
  darkPreview: string;
  onLightChange: (file: File | null) => void;
  onDarkChange: (file: File | null) => void;
}

export function LogoPicker({
  lightFile,
  darkFile,
  lightPreview,
  darkPreview,
  onLightChange,
  onDarkChange,
}: LogoPickerProps) {
  const lightRef = useRef<HTMLInputElement>(null);
  const darkRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Light */}
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <Sun size={12} /> Fondo claro
          </p>
          {lightPreview ? (
            <div className="group relative">
              <div className="flex items-center justify-center rounded-lg bg-white p-4" style={{ minHeight: 96 }}>
                <img src={lightPreview} alt="" className="max-h-20 max-w-full object-contain" />
              </div>
              <button
                type="button"
                onClick={() => onLightChange(null)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => lightRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border transition-colors hover:border-accent/50 hover:bg-bg-hover"
              style={{ minHeight: 96 }}
            >
              <Upload size={18} className="text-text-muted" />
              <span className="text-[10px] text-text-muted">Subir o arrastrar</span>
            </div>
          )}
          <input
            ref={lightRef}
            type="file"
            accept="image/png,image/svg+xml,image/webp,image/avif,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              onLightChange(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* Dark */}
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <Moon size={12} /> Fondo oscuro
          </p>
          {darkPreview ? (
            <div className="group relative">
              <div className="flex items-center justify-center rounded-lg bg-[#111113] p-4" style={{ minHeight: 96 }}>
                <img src={darkPreview} alt="" className="max-h-20 max-w-full object-contain" />
              </div>
              <button
                type="button"
                onClick={() => onDarkChange(null)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => darkRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border transition-colors hover:border-accent/50 hover:bg-bg-hover"
              style={{ minHeight: 96 }}
            >
              <Upload size={18} className="text-text-muted" />
              <span className="text-[10px] text-text-muted">Subir o arrastrar</span>
            </div>
          )}
          <input
            ref={darkRef}
            type="file"
            accept="image/png,image/svg+xml,image/webp,image/avif,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              onDarkChange(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <p className="text-[10px] text-text-muted">
        SVG o PNG con fondo transparente. Si subis solo uno, se usa para ambos modos.
      </p>
    </div>
  );
}
