"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Check,
  AlertCircle,
  Loader2,
  Save,
  Clock,
  Bell,
  BellOff,
  CircleDot,
} from "lucide-react";
import type { WhatsAppTemplates, TemplateKey, TemplateStatus } from "@/types";

const TEMPLATE_META: Record<TemplateKey, { label: string; description: string; isReminder: boolean }> = {
  reminder_24h: {
    label: "Recordatorio 24h",
    description: "Se envia 24 horas antes del turno",
    isReminder: true,
  },
  reminder_1h: {
    label: "Recordatorio 1h",
    description: "Se envia 1 hora antes del turno",
    isReminder: true,
  },
  booking_confirmed: {
    label: "Confirmacion de turno",
    description: "Se envia al confirmar una reserva",
    isReminder: false,
  },
  booking_cancelled: {
    label: "Cancelacion de turno",
    description: "Se envia al cancelar un turno",
    isReminder: false,
  },
};

const STATUS_CONFIG: Record<TemplateStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Borrador", color: "text-text-muted", bg: "bg-text-muted/10" },
  pending: { label: "Pendiente", color: "text-amber-400", bg: "bg-amber-400/10" },
  approved: { label: "Aprobado", color: "text-green-400", bg: "bg-green-400/10" },
  rejected: { label: "Rechazado", color: "text-red-400", bg: "bg-red-400/10" },
};

const DEFAULT_TEMPLATES: WhatsAppTemplates["templates"] = {
  reminder_24h: { enabled: false, twilioTemplateSid: "", status: "draft", hoursBefore: 24 },
  reminder_1h: { enabled: false, twilioTemplateSid: "", status: "draft", hoursBefore: 1 },
  booking_confirmed: { enabled: false, twilioTemplateSid: "", status: "draft" },
  booking_cancelled: { enabled: false, twilioTemplateSid: "", status: "draft" },
};

export function WhatsAppTemplatesSection({ clientId }: { clientId: string }) {
  const [templates, setTemplates] = useState<WhatsAppTemplates["templates"]>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp-config/${clientId}/templates`);
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
    } catch {
      setError("Error al cargar templates");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/whatsapp-config/${clientId}/templates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, templates }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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

  function updateTemplate<K extends TemplateKey>(key: K, field: string, value: unknown) {
    setTemplates((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={16} className="animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-text-muted" />
          <span className="text-xs font-semibold text-text">Message Templates</span>
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
        Los templates de WhatsApp permiten enviar notificaciones fuera de la ventana de 24h.
        Necesitan un Content Template SID de Twilio y aprobacion de Meta.
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] text-red-400">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <div className="space-y-3">
        {(Object.keys(TEMPLATE_META) as TemplateKey[]).map((key) => {
          const meta = TEMPLATE_META[key];
          const tpl = templates[key];
          const statusCfg = STATUS_CONFIG[tpl.status as TemplateStatus] || STATUS_CONFIG.draft;
          const isEnabled = tpl.enabled;

          return (
            <div
              key={key}
              className={`rounded-xl border transition-colors ${
                isEnabled ? "border-accent/20 bg-accent/[0.02]" : "border-border bg-bg-card"
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-1.5 ${isEnabled ? "bg-accent/10" : "bg-bg"}`}>
                    {isEnabled ? <Bell size={14} className="text-accent" /> : <BellOff size={14} className="text-text-muted" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text">{meta.label}</p>
                    <p className="text-[10px] text-text-muted">{meta.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                    <CircleDot size={8} />
                    {statusCfg.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateTemplate(key, "enabled", !isEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      isEnabled ? "bg-accent" : "bg-border"
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

              {isEnabled && (
                <div className="space-y-3 border-t border-border/50 px-4 pb-4 pt-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-text-secondary">Twilio Content SID</label>
                    <input
                      type="text"
                      value={tpl.twilioTemplateSid}
                      onChange={(e) => updateTemplate(key, "twilioTemplateSid", e.target.value)}
                      placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 font-mono text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-text-secondary">Status de aprobacion</label>
                    <select
                      value={tpl.status}
                      onChange={(e) => updateTemplate(key, "status", e.target.value)}
                      className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                    >
                      <option value="draft">Borrador</option>
                      <option value="pending">Pendiente de aprobacion</option>
                      <option value="approved">Aprobado por Meta</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>

                  {meta.isReminder && "hoursBefore" in tpl && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-text-secondary">
                        <Clock size={10} className="mr-1 inline" />
                        Horas antes del turno
                      </label>
                      <input
                        type="number"
                        value={(tpl as { hoursBefore: number }).hoursBefore}
                        onChange={(e) => updateTemplate(key, "hoursBefore", parseFloat(e.target.value) || 0)}
                        min={0.5}
                        max={72}
                        step={0.5}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
