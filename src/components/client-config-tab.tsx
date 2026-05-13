"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Save,
  Loader2,
  Palette,
  ToggleLeft,
  Clock,
  Phone,
  Settings2,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
 * Types — mirrors what master-template stores in Firestore config/{clientId}
 * ══════════════════════════════════════════════════════════════════════════ */

type BusinessNiche = "barberia" | "estetica" | "abogado" | "tattoo" | "nails";

type ConfigDoc = {
  business?: { type?: string; legalName?: string; address?: string; cancellationPolicy?: string };
  brand?: { name?: string; tagline?: string; description?: string; logo?: string; logoDark?: string; logoIconName?: string; ogImage?: string; aiPersona?: string };
  theme?: { accent?: string; accentLight?: string; surfaceDark?: string };
  activeTheme?: string;
  businessMode?: "solo" | "team";
  features?: Record<string, boolean>;
  contact?: { phone?: string; email?: string; address?: { street?: string; district?: string; cityStateZip?: string } };
  hours?: Record<string, { start?: string; end?: string } | null>;
  businessRules?: { bufferMinutes?: number; maxAdvanceBookingDays?: number; minAdvanceBookingHours?: number; autoConfirm?: boolean };
  visibleServices?: string[];
  serviceOverrides?: Record<string, Record<string, unknown>>;
  notifications?: { enabled?: boolean; bookingAlerts?: boolean; contactInquiries?: boolean };
  payment?: { enabled?: boolean; mode?: string };
  splash?: { enabled?: boolean; durationMs?: number };
  adminEmail?: string;
};

/* ── Theme presets per niche ─────────────────────────────────────────────── */
const NICHE_DEFAULTS: Record<BusinessNiche, { accent: string; accentLight: string; surfaceDark: string }> = {
  barberia: { accent: "#d97706", accentLight: "#f59e0b", surfaceDark: "#09090b" },
  estetica: { accent: "#b08d79", accentLight: "#d4b5a5", surfaceDark: "#1a1410" },
  tattoo: { accent: "#ededed", accentLight: "#ffffff", surfaceDark: "#050505" },
  nails: { accent: "#dca2ac", accentLight: "#edc2c9", surfaceDark: "#6f4a56" },
  abogado: { accent: "#1d4ed8", accentLight: "#93c5fd", surfaceDark: "#0a0f1a" },
};

const FEATURES_LIST = [
  { key: "showHero", label: "Hero" },
  { key: "showServices", label: "Servicios" },
  { key: "showWhyChooseUs", label: "Por que elegirnos" },
  { key: "showTeam", label: "Equipo" },
  { key: "showGallery", label: "Galeria" },
  { key: "showTestimonials", label: "Testimonios" },
  { key: "showInquiry", label: "Formulario contacto" },
  { key: "showLocation", label: "Ubicacion" },
  { key: "showBusinessHours", label: "Horarios" },
  { key: "showInstagram", label: "Instagram" },
  { key: "showBooking", label: "Reservas" },
  { key: "enableStaffPages", label: "Paginas de staff" },
] as const;

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const DAY_LABELS: Record<string, string> = {
  sunday: "Domingo", monday: "Lunes", tuesday: "Martes", wednesday: "Miercoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sabado",
};

/* ══════════════════════════════════════════════════════════════════════════
 * Component
 * ══════════════════════════════════════════════════════════════════════════ */

export function ClientConfigTab({ clientId, niche }: { clientId: string; niche: string }) {
  const [config, setConfig] = useState<ConfigDoc>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["brand"]));
  const [isNew, setIsNew] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/config/${clientId}`);
      const data = await res.json();
      const isEmpty = Object.keys(data).length === 0;
      setIsNew(isEmpty);
      if (isEmpty) {
        // Initialize with niche defaults
        const nicheKey = (niche || "barberia") as BusinessNiche;
        const defaults = NICHE_DEFAULTS[nicheKey] || NICHE_DEFAULTS.barberia;
        setConfig({
          business: { type: nicheKey },
          brand: { name: "", tagline: "" },
          theme: { ...defaults },
          features: {
            showHero: true, showServices: true, showWhyChooseUs: true,
            showTeam: true, showGallery: true, showTestimonials: true,
            showInquiry: true, showLocation: true, showBusinessHours: true,
            showInstagram: true, showBooking: true, enableStaffPages: true,
          },
          contact: { phone: "", email: "" },
          hours: {},
          businessRules: { bufferMinutes: 0, maxAdvanceBookingDays: 30, minAdvanceBookingHours: 2, autoConfirm: false },
          notifications: { enabled: true, bookingAlerts: true, contactInquiries: true },
          splash: { enabled: true, durationMs: 2100 },
        });
      } else {
        setConfig(data);
      }
    } catch {
      setError("Error al cargar la configuracion");
    } finally {
      setLoading(false);
    }
  }, [clientId, niche]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/config/${clientId}`, {
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

  function toggleSection(key: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // Helpers
  function updateNested(path: string, value: unknown) {
    setConfig(prev => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">
            Configuracion del sitio
          </h2>
          <p className="text-[11px] text-text-muted">
            {isNew ? "Documento nuevo — se creara al guardar" : `Firestore: config/${clientId}`}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
      )}
      {saved && (
        <div className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">Configuracion guardada correctamente</div>
      )}

      {/* ── Brand & Identity ──────────────────────────────────────────── */}
      <Section
        icon={Sparkles} title="Marca e identidad" sectionKey="brand"
        expanded={expandedSections.has("brand")} onToggle={toggleSection}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre del negocio" path="brand.name" value={getNested("brand.name")} onChange={updateNested} />
          <Field label="Tagline" path="brand.tagline" value={getNested("brand.tagline")} onChange={updateNested} />
        </div>
        <Field label="Descripcion (SEO)" path="brand.description" value={getNested("brand.description")} onChange={updateNested} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Logo (fondo claro)" path="brand.logo" value={getNested("brand.logo")} onChange={updateNested} placeholder="https://..." />
          <Field label="Logo (fondo oscuro)" path="brand.logoDark" value={getNested("brand.logoDark")} onChange={updateNested} placeholder="https://..." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="OG Image" path="brand.ogImage" value={getNested("brand.ogImage")} onChange={updateNested} placeholder="https://..." />
          <Field label="Icono fallback (Lucide)" path="brand.logoIconName" value={getNested("brand.logoIconName")} onChange={updateNested} placeholder="Scissors, Sparkles, Scale..." />
        </div>
      </Section>

      {/* ── Colors ────────────────────────────────────────────────────── */}
      <Section
        icon={Palette} title="Colores" sectionKey="theme"
        expanded={expandedSections.has("theme")} onToggle={toggleSection}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <ColorField label="Accent" path="theme.accent" value={getNested("theme.accent") as string} onChange={updateNested} />
          <ColorField label="Accent Light" path="theme.accentLight" value={getNested("theme.accentLight") as string} onChange={updateNested} />
          <ColorField label="Surface Dark" path="theme.surfaceDark" value={getNested("theme.surfaceDark") as string} onChange={updateNested} />
        </div>
        <Field label="Theme ID (opcional)" path="activeTheme" value={getNested("activeTheme")} onChange={updateNested} placeholder="barberia-urban, tattoo-fine-line..." />
      </Section>

      {/* ── Business Info ─────────────────────────────────────────────── */}
      <Section
        icon={Settings2} title="Datos del negocio" sectionKey="business"
        expanded={expandedSections.has("business")} onToggle={toggleSection}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Nicho" path="business.type" value={(getNested("business.type") as string) || ""} onChange={updateNested}
            options={[
              { value: "barberia", label: "Barberia" },
              { value: "estetica", label: "Estetica" },
              { value: "tattoo", label: "Tattoo" },
              { value: "nails", label: "Nails" },
              { value: "abogado", label: "Abogado" },
            ]}
          />
          <SelectField label="Modo" path="businessMode" value={(getNested("businessMode") as string) || "team"} onChange={updateNested}
            options={[
              { value: "team", label: "Equipo (varios profesionales)" },
              { value: "solo", label: "Solo (un profesional)" },
            ]}
          />
        </div>
        <Field label="Razon social" path="business.legalName" value={getNested("business.legalName")} onChange={updateNested} />
        <Field label="Direccion legal" path="business.address" value={getNested("business.address")} onChange={updateNested} />
        <Field label="Politica de cancelacion" path="business.cancellationPolicy" value={getNested("business.cancellationPolicy")} onChange={updateNested} />
      </Section>

      {/* ── Contact ───────────────────────────────────────────────────── */}
      <Section
        icon={Phone} title="Contacto" sectionKey="contact"
        expanded={expandedSections.has("contact")} onToggle={toggleSection}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Telefono" path="contact.phone" value={getNested("contact.phone")} onChange={updateNested} />
          <Field label="Email" path="contact.email" value={getNested("contact.email")} onChange={updateNested} />
        </div>
        <Field label="Calle" path="contact.address.street" value={getNested("contact.address.street")} onChange={updateNested} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Barrio / Zona" path="contact.address.district" value={getNested("contact.address.district")} onChange={updateNested} />
          <Field label="Ciudad, CP" path="contact.address.cityStateZip" value={getNested("contact.address.cityStateZip")} onChange={updateNested} />
        </div>
      </Section>

      {/* ── Hours ─────────────────────────────────────────────────────── */}
      <Section
        icon={Clock} title="Horarios" sectionKey="hours"
        expanded={expandedSections.has("hours")} onToggle={toggleSection}
      >
        <div className="space-y-2">
          {DAYS.map(day => {
            const val = config.hours?.[day];
            const isOpen = val !== null && val !== undefined;
            return (
              <div key={day} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      hours: {
                        ...prev.hours,
                        [day]: isOpen ? null : { start: "09:00", end: "18:00" },
                      },
                    }));
                  }}
                  className={`flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors ${
                    isOpen ? "bg-accent text-white" : "bg-bg-elevated text-text-muted"
                  }`}
                >
                  {isOpen ? <Eye size={10} /> : <EyeOff size={10} />}
                </button>
                <span className="w-20 text-xs text-text-secondary">{DAY_LABELS[day]}</span>
                {isOpen && val ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={val.start || "09:00"}
                      onChange={e => updateNested(`hours.${day}.start`, e.target.value)}
                      className="rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
                    />
                    <span className="text-[10px] text-text-muted">a</span>
                    <input
                      type="time"
                      value={val.end || "18:00"}
                      onChange={e => updateNested(`hours.${day}.end`, e.target.value)}
                      className="rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-[11px] text-text-muted">Cerrado</span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <Section
        icon={ToggleLeft} title="Secciones visibles" sectionKey="features"
        expanded={expandedSections.has("features")} onToggle={toggleSection}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES_LIST.map(f => {
            const val = config.features?.[f.key] ?? true;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => updateNested(`features.${f.key}`, !val)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  val
                    ? "border-accent/30 bg-accent/5 text-text"
                    : "border-border bg-bg-elevated text-text-muted"
                }`}
              >
                <div className={`h-3 w-6 rounded-full transition-colors ${val ? "bg-accent" : "bg-bg-active"}`}>
                  <div className={`h-3 w-3 rounded-full bg-white transition-transform ${val ? "translate-x-3" : "translate-x-0"}`} />
                </div>
                {f.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Booking Rules ─────────────────────────────────────────────── */}
      <Section
        icon={Settings2} title="Reglas de reserva" sectionKey="bookingRules"
        expanded={expandedSections.has("bookingRules")} onToggle={toggleSection}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Buffer entre turnos (min)" path="businessRules.bufferMinutes" value={getNested("businessRules.bufferMinutes") as number} onChange={updateNested} />
          <NumberField label="Reserva max. anticipada (dias)" path="businessRules.maxAdvanceBookingDays" value={getNested("businessRules.maxAdvanceBookingDays") as number} onChange={updateNested} />
          <NumberField label="Anticipacion minima (horas)" path="businessRules.minAdvanceBookingHours" value={getNested("businessRules.minAdvanceBookingHours") as number} onChange={updateNested} />
        </div>
        <ToggleField label="Confirmar turnos automaticamente" path="businessRules.autoConfirm" value={getNested("businessRules.autoConfirm") as boolean} onChange={updateNested} />
      </Section>

      {/* ── AI Persona ────────────────────────────────────────────────── */}
      <Section
        icon={Bot} title="Chatbot IA" sectionKey="ai"
        expanded={expandedSections.has("ai")} onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          El chatbot recibe automaticamente los servicios, precios, horarios y contacto del negocio. Este campo es solo para definir el tono y personalidad.
        </p>
        <TextAreaField label="Persona del chatbot (opcional)" path="brand.aiPersona" value={getNested("brand.aiPersona") as string} onChange={updateNested}
          placeholder="Ej: Responde de forma calida y profesional. Usa emojis moderadamente. Siempre sugiere agendar un turno."
        />
      </Section>

      {/* ── Notifications ─────────────────────────────────────────────── */}
      <Section
        icon={Settings2} title="Notificaciones y extras" sectionKey="notifications"
        expanded={expandedSections.has("notifications")} onToggle={toggleSection}
      >
        <ToggleField label="Notificaciones habilitadas" path="notifications.enabled" value={getNested("notifications.enabled") as boolean} onChange={updateNested} />
        <ToggleField label="Alertas de reserva" path="notifications.bookingAlerts" value={getNested("notifications.bookingAlerts") as boolean} onChange={updateNested} />
        <ToggleField label="Consultas de contacto" path="notifications.contactInquiries" value={getNested("notifications.contactInquiries") as boolean} onChange={updateNested} />
        <div className="mt-3 border-t border-border pt-3">
          <Field label="Admin Email" path="adminEmail" value={getNested("adminEmail")} onChange={updateNested} placeholder="admin@negocio.com" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ToggleField label="Splash screen" path="splash.enabled" value={getNested("splash.enabled") as boolean} onChange={updateNested} />
            <NumberField label="Duracion splash (ms)" path="splash.durationMs" value={getNested("splash.durationMs") as number} onChange={updateNested} />
          </div>
        </div>
      </Section>

      {/* ── Visible Services ──────────────────────────────────────────── */}
      <Section
        icon={Eye} title="Servicios visibles" sectionKey="visibleServices"
        expanded={expandedSections.has("visibleServices")} onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          Lista de IDs de servicios a mostrar (en orden). Dejar vacio para mostrar todos los del preset.
        </p>
        <ServiceIdList
          ids={config.visibleServices || []}
          onChange={ids => setConfig(prev => ({ ...prev, visibleServices: ids.length > 0 ? ids : undefined }))}
        />
      </Section>

      {/* ── Service Overrides ─────────────────────────────────────────── */}
      <Section
        icon={Settings2} title="Overrides de servicios" sectionKey="serviceOverrides"
        expanded={expandedSections.has("serviceOverrides")} onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          Sobreescribir nombre, precio, descripcion, duracion o imagen de un servicio especifico.
        </p>
        <ServiceOverrides
          overrides={config.serviceOverrides || {}}
          onChange={overrides => setConfig(prev => ({
            ...prev,
            serviceOverrides: Object.keys(overrides).length > 0 ? overrides : undefined,
          }))}
        />
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Sub-components
 * ══════════════════════════════════════════════════════════════════════════ */

function Section({ icon: Icon, title, sectionKey, expanded, onToggle, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string; sectionKey: string; expanded: boolean;
  onToggle: (key: string) => void; children: React.ReactNode;
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
        {expanded ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}
      </button>
      {expanded && <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

function Field({ label, path, value, onChange, placeholder }: {
  label: string; path: string; value: unknown; onChange: (path: string, value: unknown) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-text-muted">{label}</label>
      <input
        type="text"
        value={(value as string) || ""}
        onChange={e => onChange(path, e.target.value || undefined)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function NumberField({ label, path, value, onChange }: {
  label: string; path: string; value: number | undefined; onChange: (path: string, value: unknown) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-text-muted">{label}</label>
      <input
        type="number"
        value={value ?? 0}
        onChange={e => onChange(path, Number(e.target.value))}
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function ColorField({ label, path, value, onChange }: {
  label: string; path: string; value: string | undefined; onChange: (path: string, value: unknown) => void;
}) {
  const hex = value || "#000000";
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-text-muted">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={e => onChange(path, e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
        />
        <input
          type="text"
          value={hex}
          onChange={e => onChange(path, e.target.value)}
          className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 font-mono text-xs text-text focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}

function TextAreaField({ label, path, value, onChange, placeholder }: {
  label: string; path: string; value: string | undefined; onChange: (path: string, value: unknown) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-text-muted">{label}</label>
      <textarea
        value={value || ""}
        onChange={e => onChange(path, e.target.value || undefined)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function SelectField({ label, path, value, onChange, options }: {
  label: string; path: string; value: string; onChange: (path: string, value: unknown) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-text-muted">{label}</label>
      <select
        value={value}
        onChange={e => onChange(path, e.target.value)}
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, path, value, onChange }: {
  label: string; path: string; value: boolean | undefined; onChange: (path: string, value: unknown) => void;
}) {
  const on = value ?? false;
  return (
    <button
      type="button"
      onClick={() => onChange(path, !on)}
      className="flex items-center gap-2 text-xs text-text-secondary"
    >
      <div className={`h-4 w-7 rounded-full transition-colors ${on ? "bg-accent" : "bg-bg-active"}`}>
        <div className={`h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-3" : "translate-x-0"}`} />
      </div>
      {label}
    </button>
  );
}

function ServiceIdList({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const [newId, setNewId] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-md bg-bg-elevated px-2 py-1 text-xs text-text">
            {id}
            <button type="button" onClick={() => onChange(ids.filter((_, j) => j !== i))} className="text-text-muted hover:text-danger">
              <Trash2 size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newId}
          onChange={e => setNewId(e.target.value)}
          placeholder="ID del servicio (ej: haircut)"
          className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
          onKeyDown={e => {
            if (e.key === "Enter" && newId.trim()) {
              e.preventDefault();
              onChange([...ids, newId.trim()]);
              setNewId("");
            }
          }}
        />
        <button
          type="button"
          onClick={() => { if (newId.trim()) { onChange([...ids, newId.trim()]); setNewId(""); } }}
          className="rounded-lg bg-bg-elevated px-2 py-1.5 text-xs text-text-secondary hover:bg-bg-hover"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function ServiceOverrides({ overrides, onChange }: {
  overrides: Record<string, Record<string, unknown>>;
  onChange: (overrides: Record<string, Record<string, unknown>>) => void;
}) {
  const [newServiceId, setNewServiceId] = useState("");
  const ids = Object.keys(overrides);

  function updateField(serviceId: string, field: string, value: string) {
    onChange({
      ...overrides,
      [serviceId]: { ...overrides[serviceId], [field]: value || undefined },
    });
  }

  function removeService(serviceId: string) {
    const next = { ...overrides };
    delete next[serviceId];
    onChange(next);
  }

  function addService() {
    if (!newServiceId.trim() || overrides[newServiceId.trim()]) return;
    onChange({ ...overrides, [newServiceId.trim()]: {} });
    setNewServiceId("");
  }

  return (
    <div className="space-y-3">
      {ids.map(serviceId => (
        <div key={serviceId} className="rounded-lg border border-border bg-bg-elevated p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-xs font-medium text-accent">{serviceId}</span>
            <button type="button" onClick={() => removeService(serviceId)} className="text-text-muted hover:text-danger">
              <Trash2 size={12} />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-0.5 block text-[10px] text-text-muted">Nombre</label>
              <input type="text" value={(overrides[serviceId].name as string) || ""} onChange={e => updateField(serviceId, "name", e.target.value)}
                className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-text-muted">Precio</label>
              <input type="text" value={(overrides[serviceId].price as string) || ""} onChange={e => updateField(serviceId, "price", e.target.value)}
                className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-text-muted">Duracion</label>
              <input type="text" value={(overrides[serviceId].duration as string) || ""} onChange={e => updateField(serviceId, "duration", e.target.value)}
                className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-text-muted">Imagen URL</label>
              <input type="text" value={(overrides[serviceId].image as string) || ""} onChange={e => updateField(serviceId, "image", e.target.value)}
                className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text focus:border-accent focus:outline-none" />
            </div>
          </div>
          <div className="mt-2">
            <label className="mb-0.5 block text-[10px] text-text-muted">Descripcion</label>
            <input type="text" value={(overrides[serviceId].description as string) || ""} onChange={e => updateField(serviceId, "description", e.target.value)}
              className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text focus:border-accent focus:outline-none" />
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          type="text"
          value={newServiceId}
          onChange={e => setNewServiceId(e.target.value)}
          placeholder="ID del servicio a sobreescribir"
          className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
        />
        <button type="button" onClick={addService} className="rounded-lg bg-bg-elevated px-2 py-1.5 text-xs text-text-secondary hover:bg-bg-hover">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
