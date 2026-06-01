"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Mic,
  Phone,
  Save,
  Check,
  AlertCircle,
  Loader2,
  PhoneForwarded,
  MessageCircle,
  Languages,
} from "lucide-react";
import type { VoiceConfig } from "@/types";

type ConfigState = Partial<VoiceConfig>;

const VOICE_LANGUAGES = [
  { value: "he", label: "Hebreo" },
  { value: "en", label: "Ingles" },
  { value: "es", label: "Espanol" },
  { value: "ru", label: "Ruso" },
  { value: "ar", label: "Arabe" },
];

const VOICE_MODELS = [
  { value: "female", label: "Femenina" },
  { value: "male", label: "Masculina" },
];

export function VoiceConfigTab({ clientId }: { clientId: string }) {
  const [config, setConfig] = useState<ConfigState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<Array<{ path: string; message: string }>>([]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-config/${clientId}`);
      const data = await res.json();
      setConfig(data);
    } catch {
      setError("Error al cargar configuracion de voz");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  function update(path: string, value: unknown) {
    setConfig((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj: Record<string, unknown> = next as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]] || typeof obj[keys[i]] !== "object") obj[keys[i]] = {};
        obj[keys[i]] = { ...(obj[keys[i]] as Record<string, unknown>) };
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  function get(path: string): unknown {
    const keys = path.split(".");
    let obj: unknown = config;
    for (const k of keys) {
      if (!obj || typeof obj !== "object") return undefined;
      obj = (obj as Record<string, unknown>)[k];
    }
    return obj;
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setIssues([]);
    setSaved(false);
    try {
      const res = await fetch(`/api/voice-config/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 422 && Array.isArray(data.issues)) {
          setIssues(data.issues);
          throw new Error(data.error || "Config invalido");
        }
        throw new Error(data.error || "Error al guardar");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={16} className="animate-spin text-text-muted" />
      </div>
    );
  }

  const isEnabled = !!config.enabled;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-text">Voice AI</h2>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
              isEnabled
                ? "bg-violet-500/10 text-violet-400"
                : "bg-text-muted/10 text-text-muted"
            }`}
          >
            {isEnabled ? "Activo" : "Inactivo"}
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={11} className="animate-spin" />
          ) : saved ? (
            <Check size={12} />
          ) : (
            <Save size={12} />
          )}
          {saving ? "Guardando..." : saved ? "Guardado" : "Guardar"}
        </button>
      </div>

      <p className="text-[10px] text-text-muted leading-relaxed">
        Configura el agente de voz IA que atiende llamadas telefonicas.
        El agente usa Twilio ConversationRelay para procesar voz en tiempo real.
        Necesita un numero de telefono dedicado de Twilio.
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] text-red-400">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {issues.length > 0 && (
        <div className="space-y-1">
          {issues.map((iss, idx) => (
            <div key={idx} className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
              <span className="mt-0.5 font-mono text-[10px] opacity-70">ERROR</span>
              <span>
                <code className="rounded bg-black/20 px-1 py-0.5 text-[10px]">{iss.path}</code>
                {" — "}
                {iss.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Enable toggle */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-1.5 ${isEnabled ? "bg-violet-500/10" : "bg-bg"}`}>
              <Mic size={14} className={isEnabled ? "text-violet-400" : "text-text-muted"} />
            </div>
            <div>
              <p className="text-xs font-medium text-text">Habilitar Voice AI</p>
              <p className="text-[10px] text-text-muted">Activar el agente de voz para este cliente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => update("enabled", !isEnabled)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              isEnabled ? "bg-violet-500" : "bg-border"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                isEnabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Phone number */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-text-muted" />
            <span className="text-xs font-semibold text-text">Numero de telefono</span>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary">Numero Twilio</label>
            <p className="text-[10px] text-text-muted">Numero dedicado para llamadas de voz (puede ser el mismo que WhatsApp o diferente)</p>
            <input
              type="text"
              value={(get("twilio.phoneNumber") as string) || ""}
              onChange={(e) => update("twilio.phoneNumber", e.target.value)}
              placeholder="+972..."
              className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Voice settings */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Languages size={14} className="text-text-muted" />
            <span className="text-xs font-semibold text-text">Voz e idioma</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary">Tipo de voz</label>
              <select
                value={(get("voice.model") as string) || "female"}
                onChange={(e) => update("voice.model", e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
              >
                {VOICE_MODELS.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary">Idioma</label>
              <select
                value={(get("voice.language") as string) || "he"}
                onChange={(e) => update("voice.language", e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
              >
                {VOICE_LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* System prompt */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-text-muted" />
            <span className="text-xs font-semibold text-text">Comportamiento</span>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary">System Prompt</label>
            <p className="text-[10px] text-text-muted">Instrucciones de comportamiento para el agente de voz. Si se deja vacio, puede heredar del prompt de WhatsApp.</p>
            <textarea
              value={(config.systemPrompt as string) || ""}
              onChange={(e) => update("systemPrompt", e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none resize-y"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary">Mensaje de bienvenida</label>
            <p className="text-[10px] text-text-muted">Lo primero que dice el agente al atender la llamada</p>
            <input
              type="text"
              value={(config.greeting as string) || ""}
              onChange={(e) => update("greeting", e.target.value)}
              placeholder="Hola, gracias por llamar a..."
              className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Transfer */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <PhoneForwarded size={14} className="text-text-muted" />
            <span className="text-xs font-semibold text-text">Transferencia</span>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary">Numero de transferencia</label>
            <p className="text-[10px] text-text-muted">Si el agente no puede resolver, transfiere la llamada a este numero</p>
            <input
              type="text"
              value={(config.transferNumber as string) || ""}
              onChange={(e) => update("transferNumber", e.target.value)}
              placeholder="+972..."
              className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
