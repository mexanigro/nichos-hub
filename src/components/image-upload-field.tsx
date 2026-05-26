"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, Link as LinkIcon, Loader2, ImageIcon } from "lucide-react";
import { compressImage, compressImages } from "@/lib/image-compress";

/* ═══════════════════════════════════════════════════════════════════════════
 * ImageUploadField — Single image upload with drag-and-drop + URL fallback
 * ═══════════════════════════════════════════════════════════════════════════ */

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string | undefined) => void;
  clientId: string;
  label?: string;
  placeholder?: string;
  /** Optional aspect-ratio hint shown above the dropzone (e.g. "16:9 · 1920×1080"). */
  aspectHint?: string;
}

export function ImageUploadField({ value, onChange, clientId, label, placeholder, aspectHint }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState("");

  const uploadFile = useCallback(async (rawFile: File) => {
    setError("");
    setUploading(true);
    try {
      const file = await compressImage(rawFile);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/upload/${clientId}`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al subir");
        return;
      }
      if (data.urls?.[0]) {
        onChange(data.urls[0]);
      }
    } catch {
      setError("Error de red al subir");
    } finally {
      setUploading(false);
    }
  }, [clientId, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) uploadFile(file);
    else setError("Solo se aceptan imagenes");
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }, [uploadFile]);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-semibold text-text-secondary">{label}</p>
          {aspectHint && (
            <span className="text-[10px] text-text-muted/70">{aspectHint}</span>
          )}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative">
          <img
            src={value}
            alt=""
            className="h-24 w-full rounded-lg border border-border object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-danger"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!value && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
            dragOver
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/50 hover:bg-bg-hover"
          }`}
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-accent" />
          ) : (
            <>
              <Upload size={20} className="text-text-muted" />
              <span className="text-xs text-text-muted">Arrastra o haz click</span>
            </>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* URL fallback */}
      <div>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex items-center gap-1 text-[10px] text-text-muted transition-colors hover:text-accent"
        >
          <LinkIcon size={10} /> {showUrlInput ? "Ocultar URL" : "O pega una URL"}
        </button>
        {showUrlInput && (
          <input
            className="mt-1 w-full rounded-lg border border-border bg-bg-input px-3 py-1.5 text-xs text-text outline-none focus:border-accent"
            placeholder={placeholder || "https://..."}
            value={value || ""}
            onChange={(e) => onChange(e.target.value || undefined)}
          />
        )}
      </div>

      {error && <p className="text-[10px] text-danger">{error}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ImageUploadListField — Multiple image upload for arrays (gallery, portfolio)
 * ═══════════════════════════════════════════════════════════════════════════ */

interface ImageUploadListFieldProps {
  value: string[];
  onChange: (urls: string[]) => void;
  clientId: string;
  label?: string;
  placeholder?: string;
  /** Optional aspect-ratio hint shown above the dropzone. */
  aspectHint?: string;
}

export function ImageUploadListField({ value, onChange, clientId, label, placeholder, aspectHint }: ImageUploadListFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const uploadFiles = useCallback(async (rawFiles: File[]) => {
    setError("");
    setUploading(true);
    try {
      const imageFiles = rawFiles.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        setError("Solo se aceptan imagenes");
        setUploading(false);
        return;
      }
      const files = await compressImages(imageFiles);
      const form = new FormData();
      for (const f of files) {
        form.append("file", f);
      }
      const res = await fetch(`/api/upload/${clientId}`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al subir");
        setUploading(false);
        return;
      }
      if (data.urls?.length) {
        onChange([...value, ...data.urls]);
      }
      if (data.errors?.length) {
        setError(data.errors.join("; "));
      }
    } catch {
      setError("Error de red al subir");
    } finally {
      setUploading(false);
    }
  }, [clientId, value, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  }, [uploadFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) uploadFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }, [uploadFiles]);

  const addUrl = useCallback(() => {
    const url = urlDraft.trim();
    if (url) {
      onChange([...value, url]);
      setUrlDraft("");
    }
  }, [urlDraft, value, onChange]);

  const removeAt = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index));
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-semibold text-text-secondary">{label}</p>
          {aspectHint && (
            <span className="text-[10px] text-text-muted/70">{aspectHint}</span>
          )}
        </div>
      )}

      {/* Existing images grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <div key={i} className="group relative">
              <img
                src={url}
                alt=""
                className="h-20 w-full rounded-lg border border-border object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "";
                  (e.target as HTMLImageElement).className = "h-20 w-full rounded-lg border border-border bg-bg-hover flex items-center justify-center";
                }}
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-4 transition-colors ${
          dragOver
            ? "border-accent bg-accent/10"
            : "border-border hover:border-accent/50 hover:bg-bg-hover"
        }`}
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin text-accent" />
        ) : (
          <>
            <ImageIcon size={14} className="text-text-muted" />
            <span className="text-xs text-text-muted">Arrastra imagenes o haz click</span>
          </>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />

      {/* URL fallback */}
      <div>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex items-center gap-1 text-[10px] text-text-muted transition-colors hover:text-accent"
        >
          <LinkIcon size={10} /> {showUrlInput ? "Ocultar URL" : "Agregar via URL"}
        </button>
        {showUrlInput && (
          <div className="mt-1 flex gap-1.5">
            <input
              className="flex-1 rounded-lg border border-border bg-bg-input px-3 py-1.5 text-xs text-text outline-none focus:border-accent"
              placeholder={placeholder || "https://..."}
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
            />
            <button
              type="button"
              onClick={addUrl}
              disabled={!urlDraft.trim()}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              +
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-[10px] text-danger">{error}</p>}
    </div>
  );
}
