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
  User,
  CreditCard,
  Package,
} from "lucide-react";
import { ImageUploadField, ImageUploadListField } from "./image-upload-field";
import { BrandPackageImport } from "./brand-package-import";
import {
  getNicheServices,
  normalizeBusinessNiche,
  resolveVisibleServiceIds,
  toggleVisibleService,
  LANDING_SERVICES_DEFAULTS,
  type BusinessNiche,
} from "@/lib/client-config/services";

/* ══════════════════════════════════════════════════════════════════════════
 * Types — mirrors what master-template stores in Firestore config/{clientId}
 * ══════════════════════════════════════════════════════════════════════════ */

type ConfigDoc = {
  business?: { type?: string; legalName?: string; address?: string; cancellationPolicy?: string };
  businessMode?: "solo" | "team";
  brand?: { name?: string; tagline?: string; description?: string; logo?: string; logoDark?: string; logoIconName?: string; ogImage?: string; aiPersona?: string };
  theme?: { accent?: string; accentLight?: string; surfaceDark?: string };
  activeTheme?: string;
  features?: Record<string, boolean>;
  contact?: {
    phone?: string;
    email?: string;
    address?: { street?: string; district?: string; cityStateZip?: string };
    social?: { instagram?: string; facebook?: string; twitter?: string; whatsapp?: string };
  };
  hours?: Record<string, { start?: string; end?: string } | null>;
  businessRules?: { bufferMinutes?: number; maxAdvanceBookingDays?: number; minAdvanceBookingHours?: number; autoConfirm?: boolean };
  visibleServices?: string[] | null;
  serviceOverrides?: Record<string, Record<string, unknown>> | null;
  landingServicesCount?: number | null;
  notifications?: { enabled?: boolean; bookingAlerts?: boolean; contactInquiries?: boolean };
  payment?: {
    enabled?: boolean;
    mode?: "none" | "deposit" | "full" | "cash-only";
    provider?: "none" | "cardcom" | "paypal" | "meshulam" | "bit";
    acceptCash?: boolean;
    depositRequired?: boolean;
    depositAmount?: number;
    currency?: string;
  };
  splash?: { enabled?: boolean; durationMs?: number; variant?: 1 | 2 | 3 | 4 | 5 };
  adminEmail?: string;
  hero?: { backgroundImage?: string; stats?: { value: string; label: string }[] };
  gallery?: string[];
  staff?: { photoUrl?: string; portfolio?: string[] }[];
  owner?: {
    photo?: string;
    name?: string;
    role?: string;
    bio?: string;
    specialties?: string;
    experience?: string;
    certifications?: string;
    portfolio?: string[];
  };
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
  cafeteria: { accent: "#6b8e5e", accentLight: "#a3c490", surfaceDark: "#1a1c17" },
  remodelaciones: { accent: "#3b82f6", accentLight: "#60a5fa", surfaceDark: "#0f172a" },
};

type FeatureItem = { key: string; label: string; niches?: BusinessNiche[] };

const FEATURES_LIST: FeatureItem[] = [
  { key: "showHero", label: "Hero" },
  { key: "showServices", label: "Servicios" },
  { key: "showWhyChooseUs", label: "Por que elegirnos" },
  { key: "showTeam", label: "Equipo" },
  { key: "enableStaffPages", label: "Paginas de staff" },
  { key: "showAbout", label: "Sobre mi" },
  { key: "enableAboutPage", label: "Pagina personal" },
  { key: "showGallery", label: "Galeria" },
  { key: "showTestimonials", label: "Testimonios" },
  { key: "showInquiry", label: "Formulario contacto" },
  { key: "showLocation", label: "Ubicacion" },
  { key: "showBusinessHours", label: "Horarios" },
  { key: "showInstagram", label: "Instagram" },
  { key: "showBooking", label: "Reservas" },
  { key: "showWhatsAppInChat", label: "WhatsApp en chatbot" },
  { key: "showHeroStats", label: "Stats del Hero" },
  { key: "showFaq", label: "Preguntas frecuentes" },
  { key: "showPhilosophy", label: "Filosofia", niches: ["cafeteria"] },
  { key: "showProcess", label: "Proceso", niches: ["cafeteria", "remodelaciones"] },
  { key: "showAmbience", label: "Ambiente", niches: ["cafeteria"] },
  { key: "showPortfolio", label: "Portfolio", niches: ["remodelaciones"] },
  { key: "showMenu", label: "Menu", niches: ["cafeteria"] },
];

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
  const [warning, setWarning] = useState("");
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
        const nicheKey = normalizeBusinessNiche(niche);
        const defaults = NICHE_DEFAULTS[nicheKey] || NICHE_DEFAULTS.barberia;
        const nicheFeatures: Record<string, boolean> = {};
        if (nicheKey === "cafeteria") {
          nicheFeatures.showBooking = false;
          nicheFeatures.showPhilosophy = true;
          nicheFeatures.showProcess = true;
          nicheFeatures.showAmbience = true;
        } else if (nicheKey === "remodelaciones") {
          nicheFeatures.showBooking = false;
          nicheFeatures.showPortfolio = true;
          nicheFeatures.showProcess = true;
        }
        setConfig({
          business: { type: nicheKey },
          brand: { name: "", tagline: "" },
          theme: { ...defaults },
          features: {
            showHero: true, showServices: true, showWhyChooseUs: true,
            showTeam: true, showGallery: true, showTestimonials: true,
            showInquiry: true, showLocation: true, showBusinessHours: true,
            showInstagram: true, showBooking: true, enableStaffPages: true,
            showAbout: false, enableAboutPage: false,
            ...nicheFeatures,
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
    setWarning("");
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
      const data = await res.json();
      if (typeof data.normalizedBusinessType === "string") {
        setConfig(prev => ({
          ...prev,
          business: {
            ...prev.business,
            type: normalizeBusinessNiche(data.normalizedBusinessType),
          },
        }));
      }
      if (typeof data.warning === "string") {
        setWarning(data.warning);
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
      {warning && (
        <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{warning}</div>
      )}
      {saved && (
        <div className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">Configuracion guardada correctamente</div>
      )}

      {/* ── Brand Package Import ───────────────────────────────────────── */}
      <Section
        icon={Package} title="Brand Package" sectionKey="brandPackage"
        expanded={expandedSections.has("brandPackage")} onToggle={toggleSection}
      >
        <BrandPackageImport
          clientId={clientId}
          onBrandApplied={(brandConfig) => {
            setConfig((prev) => {
              const next = { ...prev };
              const bc = brandConfig as Record<string, Record<string, unknown>>;
              if (bc.brand) {
                next.brand = { ...next.brand, ...bc.brand } as ConfigDoc["brand"];
              }
              if (bc.theme) {
                next.theme = { ...next.theme, ...bc.theme } as ConfigDoc["theme"];
              }
              return next;
            });
          }}
        />
      </Section>

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
          <ImageUploadField label="Logo (fondo claro)" value={(getNested("brand.logo") as string) || ""} onChange={(url) => updateNested("brand.logo", url ?? "")} clientId={clientId} />
          <ImageUploadField label="Logo (fondo oscuro)" value={(getNested("brand.logoDark") as string) || ""} onChange={(url) => updateNested("brand.logoDark", url ?? "")} clientId={clientId} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ImageUploadField label="OG Image" value={(getNested("brand.ogImage") as string) || ""} onChange={(url) => updateNested("brand.ogImage", url ?? "")} clientId={clientId} />
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
          <SelectField label="Nicho de la build" path="business.type" value={normalizeBusinessNiche(getNested("business.type") || niche)} onChange={(_, value) => {
            const nextType = normalizeBusinessNiche(value);
            setConfig(prev => ({
              ...prev,
              business: { ...prev.business, type: nextType },
              // Service IDs are niche-specific. Reset the allow-list/patches so
              // a niche switch never leaves invisible stale IDs in Firestore.
              visibleServices: null,
              serviceOverrides: null,
            }));
          }}
            options={[
              { value: "barberia", label: "Barbería" },
              { value: "estetica", label: "Estética" },
              { value: "tattoo", label: "Tattoo" },
              { value: "nails", label: "Nails" },
              { value: "cafeteria", label: "Cafetería" },
              { value: "remodelaciones", label: "Remodelaciones" },
            ]}
          />
        </div>
        <p className="text-[10px] text-amber-300">
          No cambies este nicho sin redeployar el sitio. Al guardar, el backend lo normaliza al nicho real del deploy para que el template aplique servicios, textos e imagenes.
        </p>
        <SelectField
          label="Modo de negocio"
          path="businessMode"
          value={(config.businessMode as string) || "team"}
          onChange={updateNested}
          options={[
            { value: "team", label: "Equipo (varios profesionales)" },
            { value: "solo", label: "Solo (un profesional)" },
          ]}
        />
        <p className="text-[10px] text-text-muted">
          En modo &quot;Solo&quot;, la seccion de equipo se reemplaza por &quot;Sobre mi&quot; y el cliente no elige profesional al reservar.
        </p>
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

        {/* Redes sociales */}
        <div className="border-t border-border pt-3">
          <p className="mb-2 text-[11px] font-semibold text-text-secondary">Redes sociales</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Instagram (URL)" path="contact.social.instagram" value={getNested("contact.social.instagram")} onChange={(path, value) => { updateNested(path, value); updateNested("sections.instagram.url", value); }} placeholder="https://instagram.com/negocio" />
            <Field label="Facebook (URL)" path="contact.social.facebook" value={getNested("contact.social.facebook")} onChange={updateNested} placeholder="https://facebook.com/negocio" />
            <Field label="Twitter / X (URL)" path="contact.social.twitter" value={getNested("contact.social.twitter")} onChange={updateNested} placeholder="https://x.com/negocio" />
            <Field label="WhatsApp (URL)" path="contact.social.whatsapp" value={getNested("contact.social.whatsapp")} onChange={updateNested} placeholder="https://wa.me/1234567890" />
          </div>
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
          {FEATURES_LIST.filter(f => !f.niches || f.niches.includes(normalizeBusinessNiche(config.business?.type || niche))).map(f => {
            const defaultOn = f.key !== "showAbout" && f.key !== "enableAboutPage";
            const val = config.features?.[f.key] ?? defaultOn;
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

      {/* ── Pagos ─────────────────────────────────────────────────────── */}
      <Section
        icon={CreditCard} title="Pagos" sectionKey="payment"
        expanded={expandedSections.has("payment")} onToggle={toggleSection}
      >
        <p className="text-[10px] text-text-muted">
          El proveedor y modo se sincronizan con la web del cliente automaticamente via Firestore.
        </p>
        <ToggleField label="Pagos habilitados" path="payment.enabled" value={getNested("payment.enabled") as boolean} onChange={updateNested} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Proveedor de pago" path="payment.provider" value={(getNested("payment.provider") as string) || "none"} onChange={updateNested}
            options={[
              { value: "none", label: "Sin proveedor" },
              { value: "cardcom", label: "Cardcom" },
              { value: "paypal", label: "PayPal" },
              { value: "meshulam", label: "Meshulam" },
              { value: "bit", label: "Bit" },
            ]}
          />
          <SelectField label="Modo de cobro" path="payment.mode" value={(getNested("payment.mode") as string) || "none"} onChange={updateNested}
            options={[
              { value: "none", label: "Sin cobro online" },
              { value: "deposit", label: "Seña / Deposito" },
              { value: "full", label: "Pago completo" },
              { value: "cash-only", label: "Solo efectivo" },
            ]}
          />
        </div>
        <ToggleField label="Aceptar pago en efectivo" path="payment.acceptCash" value={getNested("payment.acceptCash") as boolean} onChange={updateNested} />
        <ToggleField label="Requiere seña para reservar" path="payment.depositRequired" value={getNested("payment.depositRequired") as boolean} onChange={updateNested} />
        {((getNested("payment.depositRequired") as boolean) || (getNested("payment.mode") as string) === "deposit") && (
          <NumberField label="Monto de seña (agorot/centavos)" path="payment.depositAmount" value={getNested("payment.depositAmount") as number} onChange={updateNested} />
        )}
        <Field label="Moneda" path="payment.currency" value={getNested("payment.currency")} onChange={updateNested} placeholder="ILS" />
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
          {(getNested("adminEmail") as string) ? (
            <p className="mt-1 text-[10px] text-green-400">✓ Notificaciones iran a {getNested("adminEmail") as string}</p>
          ) : (
            <p className="mt-1 text-[10px] text-amber-400">⚠ Sin admin email — las notificaciones no se enviaran</p>
          )}
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

      {/* ── Autobiografia (solo mode) ────────────────────────────── */}
      {config.features?.showAbout && (
        <Section
          icon={User} title="Autobiografia" sectionKey="owner"
          expanded={expandedSections.has("owner")} onToggle={toggleSection}
        >
          <p className="text-[11px] text-text-muted">
            Tu perfil personal como unico profesional. Esta informacion reemplaza la seccion de equipo en la web.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre completo" path="owner.name" value={getNested("owner.name")} onChange={updateNested} placeholder="Tu nombre" />
            <Field label="Titulo / Rol" path="owner.role" value={getNested("owner.role")} onChange={updateNested} placeholder="Master Barber, Tattoo Artist..." />
          </div>
          <ImageUploadField label="Foto de perfil" value={(getNested("owner.photo") as string) || ""} onChange={(url) => updateNested("owner.photo", url ?? "")} clientId={clientId} />
          <TextAreaField label="Bio" path="owner.bio" value={getNested("owner.bio") as string} onChange={updateNested}
            placeholder="Cuenta tu historia, tu trayectoria, que te hace diferente..."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Experiencia" path="owner.experience" value={getNested("owner.experience")} onChange={updateNested} placeholder="12 años en el rubro" />
            <Field label="Especialidades" path="owner.specialties" value={getNested("owner.specialties")} onChange={updateNested} placeholder="Fade, Beard design..." />
          </div>
          <Field label="Certificaciones" path="owner.certifications" value={getNested("owner.certifications")} onChange={updateNested} placeholder="Certificado en..." />
          <div>
            <ImageUploadListField
              label="Portfolio personal"
              value={(config.owner?.portfolio as string[] | undefined) || []}
              onChange={(imgs) => setConfig(prev => ({
                ...prev,
                owner: {
                  ...prev.owner,
                  portfolio: imgs.length > 0 ? imgs : undefined,
                },
              }))}
              clientId={clientId}
            />
          </div>
        </Section>
      )}

      {/* ── Images ──────────────────────────────────────────────────── */}
      <Section
        icon={ImageIcon} title="Imagenes" sectionKey="images"
        expanded={expandedSections.has("images")} onToggle={toggleSection}
      >
        {/* Hero background */}
        <div>
          <ImageUploadField
            label="Fondo del Hero"
            value={(getNested("hero.backgroundImage") as string) || ""}
            onChange={(url) => updateNested("hero.backgroundImage", url ?? "")}
            clientId={clientId}
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        {/* Hero Stats */}
        {config.features?.showHeroStats !== false && (
        <div className="border-t border-border pt-3">
          <p className="mb-1 text-[11px] font-semibold text-text-secondary">Stats del Hero</p>
          <p className="mb-2 text-[10px] text-text-muted">Valores como &quot;500+&quot; y &quot;Clientes atendidos&quot; que aparecen en el hero</p>
          {(config.hero?.stats || []).map((stat, i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <input
                className="flex-1 rounded-lg border border-border bg-bg-input px-3 py-1.5 text-xs text-text outline-none focus:border-accent"
                placeholder="500+"
                value={stat.value}
                onChange={(e) => {
                  const newStats = [...(config.hero?.stats || [])];
                  newStats[i] = { ...newStats[i], value: e.target.value };
                  setConfig(prev => ({ ...prev, hero: { ...prev.hero, stats: newStats } }));
                }}
              />
              <input
                className="flex-1 rounded-lg border border-border bg-bg-input px-3 py-1.5 text-xs text-text outline-none focus:border-accent"
                placeholder="Clientes atendidos"
                value={stat.label}
                onChange={(e) => {
                  const newStats = [...(config.hero?.stats || [])];
                  newStats[i] = { ...newStats[i], label: e.target.value };
                  setConfig(prev => ({ ...prev, hero: { ...prev.hero, stats: newStats } }));
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const newStats = (config.hero?.stats || []).filter((_, j) => j !== i);
                  setConfig(prev => ({ ...prev, hero: { ...prev.hero, stats: newStats.length > 0 ? newStats : undefined } }));
                }}
                className="rounded p-1 text-text-muted hover:bg-danger-muted hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newStats = [...(config.hero?.stats || []), { value: "", label: "" }];
              setConfig(prev => ({ ...prev, hero: { ...prev.hero, stats: newStats } }));
            }}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Plus size={12} /> Agregar stat
          </button>
        </div>
        )}

        {/* Why Choose Us */}
        <div className="border-t border-border pt-3">
          <ImageUploadField
            label='Seccion "Por que elegirnos" - Imagen principal'
            value={(getNested("sections.whyChooseUs.mainImage") as string) || ""}
            onChange={(url) => updateNested("sections.whyChooseUs.mainImage", url ?? "")}
            clientId={clientId}
          />
        </div>

        {/* Gallery */}
        <div className="border-t border-border pt-3">
          <ImageUploadListField
            label="Galeria"
            value={(config.gallery as string[] | undefined) || []}
            onChange={(imgs) => setConfig(prev => ({ ...prev, gallery: imgs.length > 0 ? imgs : undefined }))}
            clientId={clientId}
          />
        </div>

        {/* Instagram */}
        <div className="border-t border-border pt-3">
          <p className="mb-1 text-[11px] font-semibold text-text-secondary">Instagram</p>
          <Field label="Titulo de la seccion" path="sections.instagram.title" value={getNested("sections.instagram.title")} onChange={updateNested} placeholder="Siguenos en Instagram" />
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field label="Handle" path="sections.instagram.handle" value={getNested("sections.instagram.handle")} onChange={updateNested} placeholder="@negocio" />
            <Field label="URL perfil" path="sections.instagram.url" value={getNested("sections.instagram.url")} onChange={(path, value) => { updateNested(path, value); updateNested("contact.social.instagram", value); }} placeholder="https://instagram.com/..." />
          </div>
          <div className="mt-2">
            <ImageUploadListField
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
              clientId={clientId}
            />
          </div>
        </div>

        {/* Staff photos — only in team mode */}
        {config.features?.showTeam && (
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
                      <ImageUploadField label="Foto de perfil" value={member.photoUrl || ""} onChange={(url) => updateStaffField(i, "photoUrl", url ?? "")} clientId={clientId} />
                      <div className="mt-2">
                        <ImageUploadListField
                          label="Portfolio (imagenes)"
                          value={member.portfolio || []}
                          onChange={(imgs) => updateStaffField(i, "portfolio", imgs.length > 0 ? imgs : undefined)}
                          clientId={clientId}
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
        )}
      </Section>

      {/* ── Visible Services ──────────────────────────────────────────── */}
      <Section
        icon={Eye} title="Servicios visibles" sectionKey="visibleServices"
        expanded={expandedSections.has("visibleServices")} onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          Desactiva los servicios que el cliente no quiere mostrar. La landing usa esta lista como allow-list; si todos estan activos, se borra el override y se muestran todos los del preset.
        </p>
        {(() => {
          const nicheKey = normalizeBusinessNiche(config.business?.type || niche);
          const services = getNicheServices(nicheKey);
          const visibleIds = resolveVisibleServiceIds(config, services);
          const visibleCount = visibleIds.length;
          const visibleSet = new Set(visibleIds);

          function toggleService(id: string) {
            setConfig(prev => {
              const next = toggleVisibleService(prev, services, id);
              return {
                ...prev,
                features: next.features,
                visibleServices: next.visibleServices,
              };
            });
          }

          return (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[11px] text-text-secondary">
                <span className="font-semibold text-text">{visibleCount}</span> de{" "}
                <span className="font-semibold text-text">{services.length}</span> servicios visibles
                {visibleCount === 0 && (
                  <span className="ml-2 text-amber-300">La seccion Servicios queda apagada.</span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {services.map(s => {
                  const isOn = visibleSet.has(s.id);
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

              {/* Landing services count */}
              {visibleCount > 0 && (
                <div className="rounded-lg border border-border bg-bg-elevated p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-text-secondary">Servicios en la landing</p>
                      <p className="text-[10px] text-text-muted">
                        Cuantos servicios se muestran en la pagina principal. La pagina de servicios muestra todos.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={visibleCount}
                        value={config.landingServicesCount ?? LANDING_SERVICES_DEFAULTS[nicheKey]}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          const defaultVal = LANDING_SERVICES_DEFAULTS[nicheKey];
                          setConfig(prev => ({
                            ...prev,
                            landingServicesCount: val === defaultVal ? null : val,
                          }));
                        }}
                        className="h-1.5 w-24 cursor-pointer accent-accent"
                      />
                      <span className="min-w-[2ch] text-center text-sm font-semibold text-accent">
                        {config.landingServicesCount ?? LANDING_SERVICES_DEFAULTS[nicheKey]}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
          const nicheKey = normalizeBusinessNiche(config.business?.type || niche);
          const allServices = getNicheServices(nicheKey);
          const visibleIds = resolveVisibleServiceIds(config, allServices);
          const visibleServices = allServices.filter(s => visibleIds.includes(s.id));
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
                serviceOverrides: Object.keys(next).length > 0 ? next : null,
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
