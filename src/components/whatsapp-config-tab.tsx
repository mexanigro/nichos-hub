"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Phone,
  MessageSquare,
  Shield,
  Users,
  Pause,
  ChevronDown,
  ChevronRight,
  Save,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  CalendarDays,
  Unlink,
} from "lucide-react";
import type { WhatsAppConfig } from "@/types";

type ConfigState = Partial<WhatsAppConfig>;

export function WhatsAppConfigTab({ clientId }: { clientId: string }) {
  const [config, setConfig] = useState<ConfigState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["connection"]),
  );
  const [newPhone, setNewPhone] = useState("");
  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean;
    enabled?: boolean;
    calendarId?: string;
    connectedAt?: string;
  }>({ connected: false });
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp-config/${clientId}`);
      const data = await res.json();
      const isEmpty = Object.keys(data).length === 0;
      setIsNew(isEmpty);
      if (isEmpty) {
        setConfig({
          clientId,
          enabled: false,
          twilio: { phoneNumber: "" },
          systemPrompt: "",
          personality: { tone: "amigable", useEmojis: false, language: "auto" },
          adminPhones: [],
          pauseState: { paused: false, pausedAt: null, resumeAt: null },
          leads: {},
        });
      } else {
        setConfig(data);
      }
    } catch {
      setError("Error al cargar configuracion WhatsApp");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendar/${clientId}`);
      const data = await res.json();
      setCalendarStatus(data);
    } catch {
      setCalendarStatus({ connected: false });
    } finally {
      setCalendarLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchConfig();
    fetchCalendar();
  }, [fetchConfig, fetchCalendar]);

  async function disconnectCalendar() {
    setDisconnecting(true);
    try {
      await fetch(`/api/calendar/${clientId}`, { method: "DELETE" });
      setCalendarStatus({ connected: false });
    } catch {
      setError("Error al desconectar Google Calendar");
    } finally {
      setDisconnecting(false);
    }
  }

  function updateNested(path: string, value: unknown) {
    setConfig((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj: Record<string, unknown> = next as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]] || typeof obj[keys[i]] !== "object") {
          obj[keys[i]] = {};
        }
        obj[keys[i]] = { ...(obj[keys[i]] as Record<string, unknown>) };
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  function getNested(path: string): unknown {
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
    setSaved(false);
    try {
      const res = await fetch(`/api/whatsapp-config/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }
      setSaved(true);
      setIsNew(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function addAdminPhone() {
    const phone = newPhone.trim();
    if (!phone) return;
    const current = (config.adminPhones || []) as string[];
    if (current.includes(phone)) return;
    updateNested("adminPhones", [...current, phone]);
    setNewPhone("");
  }

  function removeAdminPhone(phone: string) {
    const current = (config.adminPhones || []) as string[];
    updateNested(
      "adminPhones",
      current.filter((p) => p !== phone),
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const leads = (config.leads || {}) as Record<string, string>;
  const adminPhones = (config.adminPhones || []) as string[];
  const paused = !!getNested("pauseState.paused");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-green-500" />
          <h2 className="text-sm font-semibold text-text">WhatsApp Agent</h2>
          {isNew && (
            <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-500">
              No configurado
            </span>
          )}
          {!isNew && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                config.enabled
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {config.enabled ? "Activo" : "Inactivo"}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? (
            <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
          ) : saved ? (
            <Check size={12} />
          ) : (
            <Save size={12} />
          )}
          {saving ? "Guardando..." : saved ? "Guardado" : "Guardar"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] text-red-400">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {/* Connection Section */}
      <Section
        icon={Phone}
        title="Conexion"
        sectionKey="connection"
        expanded={expandedSections.has("connection")}
        onToggle={toggleSection}
      >
        <ToggleField
          label="Habilitado"
          description="Activar/desactivar el agente WhatsApp para este cliente"
          checked={!!config.enabled}
          onChange={(v) => updateNested("enabled", v)}
        />
        <Field
          label="Numero Twilio"
          description="Numero de WhatsApp asignado (ej: +972501234567)"
          value={(getNested("twilio.phoneNumber") as string) || ""}
          onChange={(v) => updateNested("twilio.phoneNumber", v)}
          placeholder="+972..."
        />
      </Section>

      {/* Personality Section */}
      <Section
        icon={MessageSquare}
        title="Personalidad"
        sectionKey="personality"
        expanded={expandedSections.has("personality")}
        onToggle={toggleSection}
      >
        <TextAreaField
          label="System Prompt"
          description="Instrucciones de comportamiento para el agente IA"
          value={(config.systemPrompt as string) || ""}
          onChange={(v) => updateNested("systemPrompt", v)}
          rows={8}
        />
        <SelectField
          label="Tono"
          value={(getNested("personality.tone") as string) || "amigable"}
          onChange={(v) => updateNested("personality.tone", v)}
          options={[
            { value: "amigable", label: "Amigable" },
            { value: "profesional", label: "Profesional" },
            { value: "casual", label: "Casual" },
          ]}
        />
        <SelectField
          label="Idioma"
          value={(getNested("personality.language") as string) || "auto"}
          onChange={(v) => updateNested("personality.language", v)}
          options={[
            { value: "auto", label: "Auto-detectar" },
            { value: "es", label: "Español" },
            { value: "he", label: "Hebreo" },
            { value: "en", label: "Ingles" },
            { value: "ru", label: "Ruso" },
          ]}
        />
        <ToggleField
          label="Usar emojis"
          description="Permitir que el agente use emojis en las respuestas"
          checked={!!getNested("personality.useEmojis")}
          onChange={(v) => updateNested("personality.useEmojis", v)}
        />
      </Section>

      {/* Admin Section */}
      <Section
        icon={Shield}
        title="Telefonos Admin"
        sectionKey="admin"
        expanded={expandedSections.has("admin")}
        onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          Numeros que pueden usar comandos admin (#pausa, #volver, #estado,
          #lead, #leads)
        </p>
        <div className="space-y-1.5">
          {adminPhones.map((phone) => (
            <div
              key={phone}
              className="flex items-center justify-between rounded-lg bg-bg px-3 py-1.5"
            >
              <span className="text-xs text-text">{phone}</span>
              <button
                onClick={() => removeAdminPhone(phone)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAdminPhone()}
            placeholder="+972..."
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <button
            onClick={addAdminPhone}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] text-text-secondary hover:bg-bg-card"
          >
            <Plus size={12} />
            Agregar
          </button>
        </div>
      </Section>

      {/* Pause State Section */}
      <Section
        icon={Pause}
        title="Estado de Pausa"
        sectionKey="pause"
        expanded={expandedSections.has("pause")}
        onToggle={toggleSection}
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${paused ? "bg-yellow-500" : "bg-green-500"}`}
          />
          <span className="text-xs text-text">
            {paused ? "IA Pausada" : "IA Activa"}
          </span>
        </div>
        {paused && getNested("pauseState.resumeAt") ? (
          <p className="text-[11px] text-text-muted">
            Se reanuda:{" "}
            {new Date(
              getNested("pauseState.resumeAt") as string,
            ).toLocaleString()}
          </p>
        ) : null}
        <ToggleField
          label="Pausar IA"
          description="Pausar manualmente el agente (no respondera mensajes)"
          checked={paused}
          onChange={(v) =>
            updateNested("pauseState", {
              paused: v,
              pausedAt: v ? new Date().toISOString() : null,
              resumeAt: null,
            })
          }
        />
      </Section>

      {/* Leads Section */}
      <Section
        icon={Users}
        title={`Leads (${Object.keys(leads).length})`}
        sectionKey="leads"
        expanded={expandedSections.has("leads")}
        onToggle={toggleSection}
      >
        {Object.keys(leads).length === 0 ? (
          <p className="text-[11px] text-text-muted">
            No hay leads registrados. Se agregan via comando #lead en WhatsApp.
          </p>
        ) : (
          <div className="space-y-1">
            {Object.entries(leads).map(([phone, name]) => (
              <div
                key={phone}
                className="flex items-center justify-between rounded-lg bg-bg px-3 py-1.5"
              >
                <span className="text-xs text-text">{name}</span>
                <span className="text-[11px] text-text-muted">{phone}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Google Calendar Section */}
      <Section
        icon={CalendarDays}
        title="Google Calendar"
        sectionKey="calendar"
        expanded={expandedSections.has("calendar")}
        onToggle={toggleSection}
      >
        {calendarLoading ? (
          <p className="text-[11px] text-text-muted">Cargando...</p>
        ) : calendarStatus.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-text">Conectado</span>
              {calendarStatus.connectedAt && (
                <span className="text-[10px] text-text-muted">
                  desde {new Date(calendarStatus.connectedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="rounded-lg bg-bg px-3 py-2">
              <span className="text-[11px] text-text-muted">Calendario: </span>
              <span className="text-xs text-text">{calendarStatus.calendarId || "primary"}</span>
            </div>
            <button
              onClick={disconnectCalendar}
              disabled={disconnecting}
              className="flex items-center gap-1.5 rounded-lg border border-red-800/30 bg-red-950/20 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-950/40 disabled:opacity-50"
            >
              <Unlink size={12} />
              {disconnecting ? "Desconectando..." : "Desconectar"}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-text-muted">
              Conecta Google Calendar para sincronizar turnos reservados via WhatsApp.
            </p>
            <a
              href={`/api/calendar/auth?clientId=${clientId}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent/20"
            >
              <CalendarDays size={12} />
              Conectar Google Calendar
            </a>
          </div>
        )}
      </Section>
    </div>
  );
}

/* ── UI Components ── */

function Section({
  icon: Icon,
  title,
  sectionKey,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  sectionKey: string;
  expanded: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card">
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <Icon size={14} className="text-text-muted" />
        <span className="flex-1 text-xs font-semibold text-text">{title}</span>
        {expanded ? (
          <ChevronDown size={14} className="text-text-muted" />
        ) : (
          <ChevronRight size={14} className="text-text-muted" />
        )}
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  description,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-text-secondary">
        {label}
      </label>
      {description && (
        <p className="text-[10px] text-text-muted">{description}</p>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function TextAreaField({
  label,
  description,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-text-secondary">
        {label}
      </label>
      {description && (
        <p className="text-[10px] text-text-muted">{description}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none resize-y"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-text-secondary">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className="text-[11px] font-medium text-text-secondary">
          {label}
        </span>
        {description && (
          <p className="text-[10px] text-text-muted">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
