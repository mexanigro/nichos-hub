"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Save,
  Loader2,
  Palette,
  ToggleLeft,
  Clock,
  Phone,
  Store,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Bell,
  CalendarCog,
  Wrench,
  Film,
  ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
 * Types — mirrors what master-template stores in Firestore config/{clientId}
 * ══════════════════════════════════════════════════════════════════════════ */

type BusinessNiche = "barberia" | "estetica" | "tattoo" | "nails";

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
  splash?: { enabled?: boolean; durationMs?: number; variant?: 1 | 2 | 3 | 4 | 5 };
  adminEmail?: string;
  hero?: { backgroundImage?: string };
  gallery?: string[];
  staff?: { photoUrl?: string; portfolio?: string[] }[];
  sections?: {
    services?: { images?: string[] };
    whyChooseUs?: { mainImage?: string };
    instagram?: { title?: string; handle?: string; url?: string; images?: string[] };
  };
};

/* ── Theme presets per niche ─────────────────────────────────────────────── */
const NICHE_DEFAULTS: Record<BusinessNiche, { accent: string; accentLight: string; surfaceDark: string }> = {
  barberia: { accent: "#d97706", accentLight: "#f59e0b", surfaceDark: "#09090b" },
  estetica: { accent: "#b08d79", accentLight: "#d4b5a5", surfaceDark: "#1a1410" },
  tattoo: { accent: "#ededed", accentLight: "#ffffff", surfaceDark: "#050505" },
  nails: { accent: "#dca2ac", accentLight: "#edc2c9", surfaceDark: "#6f4a56" },
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
  { key: "showWhatsAppInChat", label: "WhatsApp en chatbot" },
] as const;

const NICHE_SERVICES: Record<BusinessNiche, { id: string; label: string }[]> = {
  barberia: [
    { id: "haircut", label: "Haircut" },
    { id: "beard-sculpt", label: "Beard Sculpture" },
    { id: "straight-shave", label: "Straight Razor Shave" },
    { id: "color-treatment", label: "Color & Tint" },
    { id: "full-ritual", label: "The Full Ritual" },
  ],
  estetica: [
    { id: "lip-filler", label: "Lip Filler" },
    { id: "cheek-filler", label: "Cheek & Jawline Filler" },
    { id: "botox", label: "Botox" },
    { id: "facial", label: "Signature Facial" },
    { id: "skin-booster", label: "Skin Booster" },
  ],
  tattoo: [
    { id: "consultation", label: "Consultation" },
    { id: "custom-design", label: "Custom Design" },
    { id: "fine-line", label: "Fine Line" },
    { id: "black-grey-realism", label: "Black & Grey Realism" },
    { id: "cover-up", label: "Cover-Up" },
    { id: "flash-small", label: "Flash & Small" },
    { id: "piercing", label: "Piercing" },
  ],
  nails: [
    { id: "classic-manicure", label: "Classic Manicure" },
    { id: "gel-manicure", label: "Gel Manicure" },
    { id: "acrylic-full-set", label: "Acrylic Full Set" },
    { id: "nail-art", label: "Nail Art" },
    { id: "spa-pedicure", label: "Spa Pedicure" },
    { id: "extensions-infills", label: "Extensions & Infills" },
  ],
};

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
          splash: { enabled: true, durationMs: 2100, variant: 1 },
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
        icon={Store} title="Datos del negocio" sectionKey="business"
        expanded={expandedSections.has("business")} onToggle={toggleSection}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Nicho" path="business.type" value={(getNested("business.type") as string) || ""} onChange={updateNested}
            options={[
              { value: "barberia", label: "Barberia" },
              { value: "estetica", label: "Estetica" },
              { value: "tattoo", label: "Tattoo" },
              { value: "nails", label: "Nails" },
            ]}
          />
          <SelectField label="Modo" path="businessMode" value={(getNested("businessMode") as string) || "team"} onChange={(path, value) => {
            updateNested(path, value);
            if (value === "solo") {
              updateNested("features.showTeam", false);
              updateNested("features.enableStaffPages", false);
            } else {
              updateNested("features.showTeam", true);
              updateNested("features.enableStaffPages", true);
            }
          }}
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
        icon={CalendarCog} title="Reglas de reserva" sectionKey="bookingRules"
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
        icon={Bell} title="Notificaciones y extras" sectionKey="notifications"
        expanded={expandedSections.has("notifications")} onToggle={toggleSection}
      >
        <ToggleField label="Notificaciones habilitadas" path="notifications.enabled" value={getNested("notifications.enabled") as boolean} onChange={updateNested} />
        <ToggleField label="Alertas de reserva" path="notifications.bookingAlerts" value={getNested("notifications.bookingAlerts") as boolean} onChange={updateNested} />
        <ToggleField label="Consultas de contacto" path="notifications.contactInquiries" value={getNested("notifications.contactInquiries") as boolean} onChange={updateNested} />
        <div className="mt-3 border-t border-border pt-3">
          <Field label="Admin Email" path="adminEmail" value={getNested("adminEmail")} onChange={updateNested} placeholder="admin@negocio.com" />
        </div>
      </Section>

      {/* ── Splash Screen ────────────────────────────────────────────── */}
      <Section
        icon={Film} title="Splash screen" sectionKey="splash"
        expanded={expandedSections.has("splash")} onToggle={toggleSection}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleField label="Splash habilitado" path="splash.enabled" value={getNested("splash.enabled") as boolean} onChange={updateNested} />
          <NumberField label="Duracion (ms)" path="splash.durationMs" value={getNested("splash.durationMs") as number} onChange={updateNested} />
        </div>

        <p className="text-[11px] font-medium text-text-muted">Variante de animacion</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {([
            { value: 1, name: "Classic", desc: "Logo + letras animadas + linea accent" },
            { value: 2, name: "Curtain", desc: "Paneles se abren como un telon" },
            { value: 3, name: "Pulse", desc: "Onda radial que revela la marca" },
            { value: 4, name: "Typewriter", desc: "Nombre escrito caracter a caracter" },
            { value: 5, name: "Vortex", desc: "Particulas orbitales que convergen" },
          ] as const).map(v => {
            const current = (getNested("splash.variant") as number) ?? 1;
            const isSelected = current === v.value;
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => updateNested("splash.variant", v.value)}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "border-accent/40 bg-accent/8 ring-1 ring-accent/20"
                    : "border-border bg-bg-elevated hover:bg-bg-active"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                    isSelected ? "bg-accent text-white" : "bg-bg-active text-text-muted"
                  }`}>
                    {v.value}
                  </div>
                  <span className={`text-xs font-semibold ${isSelected ? "text-text" : "text-text-secondary"}`}>{v.name}</span>
                </div>
                <p className="mt-1 pl-8 text-[10px] text-text-muted">{v.desc}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Images ──────────────────────────────────────────────────── */}
      <Section
        icon={ImageIcon} title="Imagenes" sectionKey="images"
        expanded={expandedSections.has("images")} onToggle={toggleSection}
      >
        {/* Hero background */}
        <div>
          <p className="mb-1 text-[11px] font-semibold text-text-secondary">Fondo del Hero</p>
          <Field label="URL imagen de fondo" path="hero.backgroundImage" value={getNested("hero.backgroundImage")} onChange={updateNested} placeholder="https://images.unsplash.com/..." />
          {(getNested("hero.backgroundImage") as string) ? (
            <img src={getNested("hero.backgroundImage") as string} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" />
          ) : null}
        </div>

        {/* Why Choose Us */}
        <div className="border-t border-border pt-3">
          <p className="mb-1 text-[11px] font-semibold text-text-secondary">Seccion "Por que elegirnos"</p>
          <Field label="Imagen principal" path="sections.whyChooseUs.mainImage" value={getNested("sections.whyChooseUs.mainImage")} onChange={updateNested} placeholder="https://..." />
          {(getNested("sections.whyChooseUs.mainImage") as string) ? (
            <img src={getNested("sections.whyChooseUs.mainImage") as string} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" />
          ) : null}
        </div>

        {/* Gallery */}
        <div className="border-t border-border pt-3">
          <p className="mb-1 text-[11px] font-semibold text-text-secondary">Galeria</p>
          <ImageListField
            value={(config.gallery as string[] | undefined) || []}
            onChange={(imgs) => setConfig(prev => ({ ...prev, gallery: imgs.length > 0 ? imgs : undefined }))}
            placeholder="URL de imagen de galeria"
          />
        </div>

        {/* Instagram */}
        <div className="border-t border-border pt-3">
          <p className="mb-1 text-[11px] font-semibold text-text-secondary">Instagram</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Handle" path="sections.instagram.handle" value={getNested("sections.instagram.handle")} onChange={updateNested} placeholder="@negocio" />
            <Field label="URL perfil" path="sections.instagram.url" value={getNested("sections.instagram.url")} onChange={updateNested} placeholder="https://instagram.com/..." />
          </div>
          <div className="mt-2">
            <ImageListField
              value={(config.sections?.instagram?.images as string[] | undefined) || []}
              onChange={(imgs) => setConfig(prev => ({
                ...prev,
                sections: {
                  ...prev.sections,
                  instagram: {
                    ...prev.sections?.instagram,
                    images: imgs.length > 0 ? imgs : undefined,
                  },
                },
              }))}
              placeholder="URL de imagen para grid de Instagram"
            />
          </div>
        </div>

        {/* Staff photos — only when staff overrides exist or can be added */}
        <div className="border-t border-border pt-3">
          <p className="mb-1 text-[11px] font-semibold text-text-secondary">Fotos del equipo</p>
          <p className="mb-2 text-[10px] text-text-muted">
            Agrega fotos de perfil y portfolio para cada miembro del equipo. El orden debe coincidir con el del preset.
          </p>
          {(() => {
            const staffList = config.staff || [];
            function updateStaffField(index: number, field: string, value: unknown) {
              setConfig(prev => {
                const arr = [...(prev.staff || [])];
                while (arr.length <= index) arr.push({});
                arr[index] = { ...arr[index], [field]: value || undefined };
                // Clean empty entries from end
                while (arr.length > 0 && Object.values(arr[arr.length - 1]).every(v => v === undefined)) arr.pop();
                return { ...prev, staff: arr.length > 0 ? arr : undefined };
              });
            }
            function addStaffSlot() {
              setConfig(prev => ({ ...prev, staff: [...(prev.staff || []), {}] }));
            }
            return (
              <div className="space-y-3">
                {staffList.map((member, i) => (
                  <div key={i} className="rounded-lg border border-border bg-bg-elevated p-3">
                    <span className="mb-2 block text-[10px] font-medium text-text-muted">Miembro {i + 1}</span>
                    <Field label="Foto de perfil" path={`_staff_${i}_photo`} value={member.photoUrl || ""} onChange={(_p, v) => updateStaffField(i, "photoUrl", v)} placeholder="https://..." />
                    {member.photoUrl && (
                      <img src={member.photoUrl} alt="" className="mt-1 h-16 w-16 rounded-full object-cover" />
                    )}
                    <div className="mt-2">
                      <label className="mb-1 block text-[10px] text-text-muted">Portfolio (imagenes)</label>
                      <ImageListField
                        value={member.portfolio || []}
                        onChange={(imgs) => updateStaffField(i, "portfolio", imgs.length > 0 ? imgs : undefined)}
                        placeholder="URL de imagen de portfolio"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStaffSlot}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-text-muted transition-colors hover:border-accent hover:text-text"
                >
                  <Plus size={12} /> Agregar miembro
                </button>
              </div>
            );
          })()}
        </div>
      </Section>

      {/* ── Visible Services ──────────────────────────────────────────── */}
      <Section
        icon={Eye} title="Servicios visibles" sectionKey="visibleServices"
        expanded={expandedSections.has("visibleServices")} onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          Desactiva los servicios que el cliente no quiere mostrar. Si todos estan activos, se muestran todos los del preset.
        </p>
        {(() => {
          const nicheKey = ((config.business?.type as string) || niche || "barberia") as BusinessNiche;
          const services = NICHE_SERVICES[nicheKey] || [];
          const visible = config.visibleServices;
          // If visibleServices is not set, all are visible
          const allVisible = !visible || visible.length === 0;

          function toggleService(id: string) {
            setConfig(prev => {
              const current = prev.visibleServices;
              if (!current || current.length === 0) {
                // First toggle off: start with all IDs minus this one
                const allIds = services.map(s => s.id);
                const next = allIds.filter(sid => sid !== id);
                return { ...prev, visibleServices: next.length > 0 ? next : undefined };
              }
              if (current.includes(id)) {
                // Toggle off
                const next = current.filter(sid => sid !== id);
                return { ...prev, visibleServices: next.length > 0 ? next : undefined };
              }
              // Toggle on
              return { ...prev, visibleServices: [...current, id] };
            });
          }

          return (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(s => {
                const isOn = allVisible || (visible?.includes(s.id) ?? false);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                      isOn
                        ? "border-accent/30 bg-accent/5 text-text"
                        : "border-border bg-bg-elevated text-text-muted"
                    }`}
                  >
                    <div className={`h-3 w-6 rounded-full transition-colors ${isOn ? "bg-accent" : "bg-bg-active"}`}>
                      <div className={`h-3 w-3 rounded-full bg-white transition-transform ${isOn ? "translate-x-3" : "translate-x-0"}`} />
                    </div>
                    {s.label}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </Section>

      {/* ── Service Overrides ─────────────────────────────────────────── */}
      <Section
        icon={Wrench} title="Personalizar servicios" sectionKey="serviceOverrides"
        expanded={expandedSections.has("serviceOverrides")} onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          Cambia nombre, precio, duracion, descripcion o imagen de cada servicio. Solo se guardan los campos que modifiques.
        </p>
        {(() => {
          const nicheKey = ((config.business?.type as string) || niche || "barberia") as BusinessNiche;
          const allServices = NICHE_SERVICES[nicheKey] || [];
          const visible = config.visibleServices;
          const visibleServices = (!visible || visible.length === 0)
            ? allServices
            : allServices.filter(s => visible.includes(s.id));
          const overrides = config.serviceOverrides || {};

          function updateField(serviceId: string, field: string, value: string) {
            setConfig(prev => {
              const current = prev.serviceOverrides || {};
              const patch = { ...current[serviceId], [field]: value || null };
              // Remove keys that are null (cleared)
              const cleaned: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(patch)) {
                if (v !== null && v !== undefined) cleaned[k] = v;
              }
              const next = { ...current, [serviceId]: cleaned };
              // Remove service entry if empty
              if (Object.keys(cleaned).length === 0) delete next[serviceId];
              return {
                ...prev,
                serviceOverrides: Object.keys(next).length > 0 ? next : undefined,
              };
            });
          }

          return (
            <div className="space-y-3">
              {visibleServices.map(s => {
                const patch = overrides[s.id] || {};
                const hasOverrides = Object.keys(patch).length > 0;
                return (
                  <div key={s.id} className={`rounded-lg border p-3 ${hasOverrides ? "border-accent/30 bg-accent/5" : "border-border bg-bg-elevated"}`}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-accent">{s.id}</span>
                      <span className="text-[10px] text-text-muted">{s.label}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-0.5 block text-[10px] text-text-muted">Nombre</label>
                        <input type="text" value={(patch.name as string) || ""} onChange={e => updateField(s.id, "name", e.target.value)}
                          placeholder={s.label}
                          className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] text-text-muted">Precio</label>
                        <input type="text" value={(patch.price as string) || ""} onChange={e => updateField(s.id, "price", e.target.value)}
                          className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] text-text-muted">Duracion</label>
                        <input type="text" value={(patch.duration as string) || ""} onChange={e => updateField(s.id, "duration", e.target.value)}
                          className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] text-text-muted">Imagen URL</label>
                        <input type="text" value={(patch.image as string) || ""} onChange={e => updateField(s.id, "image", e.target.value)}
                          className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="mb-0.5 block text-[10px] text-text-muted">Descripcion</label>
                      <input type="text" value={(patch.description as string) || ""} onChange={e => updateField(s.id, "description", e.target.value)}
                        className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
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
        value={(value as string) ?? ""}
        onChange={e => onChange(path, e.target.value || null)}
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
        onChange={e => onChange(path, e.target.value || null)}
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

function ImageListField({ value, onChange, placeholder }: {
  value: string[];
  onChange: (imgs: string[]) => void;
  placeholder?: string;
}) {
  function updateItem(index: number, url: string) {
    const next = [...value];
    next[index] = url;
    onChange(next);
  }
  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }
  function addItem() {
    onChange([...value, ""]);
  }

  return (
    <div className="space-y-2">
      {value.map((url, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={url}
              onChange={e => updateItem(i, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
            />
            {url && (
              <img src={url} alt="" className="mt-1 h-12 rounded object-cover" onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-[11px] text-text-muted transition-colors hover:border-accent hover:text-text"
      >
        <Plus size={12} /> Agregar imagen
      </button>
    </div>
  );
}
