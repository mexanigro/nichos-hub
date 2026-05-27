"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Award,
  Quote,
  Users,
  Briefcase,
  Eye,
  EyeOff,
  Coffee,
  Hammer,
  UtensilsCrossed,
  ListOrdered,
  Bell,
  CalendarCog,
  Film,
  ImageIcon,
  Plus,
  Trash2,
  User,
  CreditCard,
  Package,
  Boxes,
  Layout,
} from "lucide-react";
import { ImageUploadField, ImageUploadListField } from "./image-upload-field";
import { BrandPackageImport } from "./brand-package-import";
import { ClientLanguageBanner } from "./client-language-banner";
import { ClientLanguageProvider } from "@/lib/client-language-context";
import {
  type ClientLanguage,
  normalizeClientLanguage,
} from "@/lib/client-language";
import { placeholderFor } from "@/lib/dashboard-placeholders";
import { LanguageMismatchWarning } from "./language-mismatch-warning";
import { BenefitsEditor, type Benefit } from "./config-editors/benefits-editor";
import { TestimonialsEditor, type Testimonial } from "./config-editors/testimonials-editor";
import { StaffEditor, type StaffMember } from "./config-editors/staff-editor";
import { ServicesEditor, type Service } from "./config-editors/services-editor";
import { NumberedStepsEditor, type NumberedStep } from "./config-editors/numbered-steps-editor";
import { AmbienceEditor, type AmbienceSector } from "./config-editors/ambience-editor";
import {
  PortfolioEditor,
  type PortfolioFilter,
  type PortfolioProject,
} from "./config-editors/portfolio-editor";
import { MenuEditor, type MenuCategory, type MenuItem as MenuItemConfig } from "./config-editors/menu-editor";
import { SaveDiffModal } from "./save-diff-modal";
import { SplashVariantPreview, type SplashVariantId } from "./splash-variant-preview";
import { HeroObjectsEditor, type HeroObjectsMap } from "./config-editors/hero-objects-editor";
import { SectionVariantSelector } from "./config-editors/section-variant-selector";
import { HeroSlotPicker } from "./config-editors/hero-slot-picker";
import {
  HERO_VARIANTS,
  WHY_CHOOSE_VARIANTS,
  SERVICES_VARIANTS,
  GALLERY_VARIANTS,
  BOOKING_VARIANTS,
} from "./config-editors/variant-thumbnails";
import {
  ServicesCardStackTabsEditor,
  GalleryGridWithFiltersEditor,
  GalleryBentoStatsEditor,
  GalleryPortraitBentoCameoEditor,
  BookingFormMapHours3DEditor,
} from "./config-editors/variant-specific-configs";
import {
  normalizeBusinessNiche,
  type BusinessNiche,
} from "@/lib/client-config/services";
import { validateConfig, hasBlockingIssues, type ConfigIssue } from "@/lib/config-validator";

/* ══════════════════════════════════════════════════════════════════════════
 * Types — mirrors what master-template stores in Firestore config/{clientId}
 * ══════════════════════════════════════════════════════════════════════════ */

type ConfigDoc = {
  business?: { type?: string; legalName?: string; address?: string; cancellationPolicy?: string };
  businessMode?: "solo" | "team";
  brand?: { name?: string; tagline?: string; description?: string; logo?: string; logoDark?: string; logoIconName?: string; faviconEmoji?: string; ogImage?: string; aiPersona?: string };
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
  splash?: {
    enabled?: boolean;
    durationMs?: number;
    variant?:
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | "impact-scale"
      | "impact-split"
      | "impact-reveal-3d";
    /** impact-scale only — number of bands (3-9). */
    bandCount?: number;
    /** impact-scale only — band orientation. */
    bandDirection?: "horizontal" | "vertical";
    /** impact-split only — split axis. */
    splitDirection?: "horizontal" | "vertical";
    /** impact-reveal-3d only — per-splash ambient particles override. */
    ambientParticles?: "bubbles" | "smoke" | "sparkles" | "pearls" | "none";
  };
  adminEmail?: string;
  hero?: { backgroundImage?: string; stats?: { value: string; label: string }[] };
  gallery?: string[];
  staff?: StaffMember[];
  services?: Service[];
  testimonials?: Testimonial[];
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
  heroObjects?: HeroObjectsMap;
  /** Variant selectors for the 3D Impact rendering system. */
  heroVariant?: "standard" | "slider" | "hero-3d-object";
  whyChooseUsVariant?: "standard" | "icon-grid-3d";
  servicesVariant?: "standard" | "list-with-icons" | "treatment-card-grid" | "card-stack-tabs";
  galleryVariant?: "standard" | "bento-stats" | "grid-with-filters" | "portrait-bento-3d-cameo";
  bookingVariant?: "standard" | "form-map-hours-3d";
  /** Slot used by the active hero variant (primary, secondary, accent, or custom name). */
  heroObjectSlot?: string;
  /** Slot used by the gallery cameo variant. */
  galleryObjectSlot?: string;
  /** Slot used by the why-choose 3D variant. */
  whyChooseUsObjectSlot?: string;
  show3DObject?: boolean;
  /** Global ambient particles override — when set, takes precedence over per-slot defaults. */
  globalAmbientParticles?: {
    enabled?: boolean;
    type?: "bubbles" | "smoke" | "sparkles" | "pearls" | "none";
    density?: "subtle" | "medium" | "strong";
  };
  /** Variant-specific configs for the 3D Impact system. */
  variantConfigs?: {
    servicesCardStackTabs?: {
      filters?: string[];
      layout?: "cards-grid" | "stack-carousel";
    };
    galleryGridWithFilters?: {
      filters?: string[];
      imageTags?: Record<string, string[]>;
    };
    galleryBentoStats?: {
      stats?: { value: string; label: string }[];
    };
    galleryPortraitBentoCameo?: {
      cameoPositions?: string[];
    };
    bookingFormMapHours3D?: {
      showMap?: boolean;
      showHours?: boolean;
      formFields?: string[];
    };
  };
  sections?: {
    services?: { images?: string[] };
    whyChooseUs?: { mainImage?: string; badge?: string; benefits?: Benefit[] };
    instagram?: { title?: string; handle?: string; url?: string; images?: string[] };
    philosophy?: { pillars?: NumberedStep[] };
    process?: { steps?: NumberedStep[] };
    ambience?: { sectors?: AmbienceSector[] };
    portfolio?: { filters?: PortfolioFilter[]; projects?: PortfolioProject[] };
    menu?: { title?: string; subtitle?: string; categories?: MenuCategory[]; items?: MenuItemConfig[] };
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

type SplashVariantSpec = {
  value: SplashVariantId;
  name: string;
  desc: string;
  recommendedFor?: readonly string[];
  /** "3D" badge in the corner. */
  badge?: string;
  /** Variant only works when `heroObjects.primary` has a base image or composition. */
  requiresHeroPrimary?: boolean;
};

const SPLASH_VARIANTS: readonly SplashVariantSpec[] = [
  { value: 1, name: "Classic", desc: "Logo + letras animadas + linea accent", recommendedFor: ["barberia"] },
  { value: 2, name: "Curtain", desc: "Paneles se abren como un telon" },
  { value: 3, name: "Pulse", desc: "Onda radial que revela la marca", recommendedFor: ["nails"] },
  { value: 4, name: "Typewriter", desc: "Nombre escrito caracter a caracter", recommendedFor: ["estetica"] },
  { value: 5, name: "Vortex", desc: "Particulas orbitales que convergen", recommendedFor: ["tattoo"] },
  { value: 6, name: "Cafeteria", desc: "Mocha calido + titulo serif en dos lineas", recommendedFor: ["cafeteria"] },
  { value: 7, name: "Remodelaciones", desc: "Wipe reveal bold + corporate", recommendedFor: ["remodelaciones"] },
  {
    value: "impact-scale",
    name: "Impact Scale",
    desc: "Bandas que colapsan al centro alrededor del objeto 3D",
    badge: "3D",
    requiresHeroPrimary: true,
  },
  {
    value: "impact-split",
    name: "Impact Split",
    desc: "Split horizontal/vertical que revela la escena 3D",
    badge: "3D",
  },
  {
    value: "impact-reveal-3d",
    name: "Impact Reveal 3D",
    desc: "Reveal premium con particulas ambientales y rotacion del objeto",
    badge: "3D",
    requiresHeroPrimary: true,
  },
] as const;

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const DAY_LABELS: Record<string, string> = {
  sunday: "Domingo", monday: "Lunes", tuesday: "Martes", wednesday: "Miercoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sabado",
};

/* ══════════════════════════════════════════════════════════════════════════
 * Component
 * ══════════════════════════════════════════════════════════════════════════ */

export function ClientConfigTab({
  clientId,
  niche,
  language,
  onLanguageChange,
  onSaved,
}: {
  clientId: string;
  niche: string;
  language: ClientLanguage;
  onLanguageChange?: (next: ClientLanguage) => void;
  /** Fired once Firestore confirms a successful save. Parent uses this to refresh embedded previews. */
  onSaved?: () => void;
}) {
  const lang = normalizeClientLanguage(language);
  const [config, setConfig] = useState<ConfigDoc>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [issues, setIssues] = useState<ConfigIssue[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["brand"]));
  const [isNew, setIsNew] = useState(false);
  /** Snapshot of the config as last loaded / last successfully saved. Source of truth for the diff modal. */
  const originalConfigRef = useRef<ConfigDoc>({});
  const [diffModalOpen, setDiffModalOpen] = useState(false);

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
        originalConfigRef.current = data;
      }
    } catch {
      setError("Error al cargar la configuracion");
    } finally {
      setLoading(false);
    }
  }, [clientId, niche]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  function handleRequestSave() {
    // First gate: local validation. Blocks if any errors.
    setError("");
    setWarning("");
    setSaved(false);
    const localIssues = validateConfig(config);
    setIssues(localIssues);
    if (hasBlockingIssues(localIssues)) {
      setError("Hay errores que impiden guardar. Revisa los avisos rojos abajo.");
      return;
    }
    // Second gate: show diff modal so the owner confirms what will land in Firestore.
    setDiffModalOpen(true);
  }

  async function handleConfirmedSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/config/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 422 && Array.isArray(data.issues)) {
          setIssues(data.issues as ConfigIssue[]);
          throw new Error(data.error || "Config invalido");
        }
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
      // Server returns surviving warnings; keep them visible (no blocking).
      if (Array.isArray(data.warnings)) {
        setIssues(data.warnings as ConfigIssue[]);
      } else {
        setIssues([]);
      }
      setSaved(true);
      setIsNew(false);
      setDiffModalOpen(false);
      onSaved?.();
      // Snapshot the saved state so the next diff is computed against ground truth.
      originalConfigRef.current = config;
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
    <ClientLanguageProvider language={lang}>
    <div className="space-y-4">
      <ClientLanguageBanner
        clientId={clientId}
        language={lang}
        onChange={onLanguageChange}
      />
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
          onClick={handleRequestSave}
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
      {issues.length > 0 && (
        <div className="space-y-1">
          {issues.map((iss, idx) => (
            <div
              key={`${iss.path}-${idx}`}
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-[11px] ${
                iss.severity === "error"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-amber-500/10 text-amber-300"
              }`}
            >
              <span className="mt-0.5 inline-block min-w-[3.5rem] font-mono text-[10px] opacity-70">
                {iss.severity === "error" ? "ERROR" : "AVISO"}
              </span>
              <span className="flex-1">
                <code className="rounded bg-black/20 px-1 py-0.5 text-[10px]">{iss.path || "config"}</code>
                {" — "}
                {iss.message}
              </span>
            </div>
          ))}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-400">
          Configuracion guardada. El sitio del cliente refleja los cambios en ~10s (cache CDN).
        </div>
      )}

      <GroupBand label="BRANDING" hint="identidad visual y verbal" />

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
              const bc = brandConfig as Record<string, unknown>;
              if (bc.brand) {
                next.brand = { ...next.brand, ...(bc.brand as Record<string, unknown>) } as ConfigDoc["brand"];
              }
              if (bc.theme) {
                next.theme = { ...next.theme, ...(bc.theme as Record<string, unknown>) } as ConfigDoc["theme"];
              }
              if (bc.typography) {
                (next as Record<string, unknown>).typography = bc.typography;
              }
              if (bc.hero) {
                next.hero = { ...next.hero, ...(bc.hero as Record<string, unknown>) } as ConfigDoc["hero"];
              }
              if (bc.gallery) {
                (next as Record<string, unknown>).gallery = bc.gallery;
              }
              if (bc.sections) {
                const sections = bc.sections as Record<string, unknown>;
                if (!next.sections) (next as Record<string, unknown>).sections = {};
                const ns = next.sections as Record<string, unknown>;
                // Merge each section key
                for (const [key, val] of Object.entries(sections)) {
                  if (val && typeof val === "object") {
                    ns[key] = { ...(ns[key] as Record<string, unknown> || {}), ...(val as Record<string, unknown>) };
                  } else {
                    ns[key] = val;
                  }
                }
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
        {(() => {
          const rawName = getNested("brand.name");
          const name = typeof rawName === "string" ? rawName.trim() : "";
          const looksLikePlaceholder = /^sin\s*nombre$/i.test(name);
          if (!name || looksLikePlaceholder) {
            return (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300">
                {looksLikePlaceholder
                  ? <>El nombre figura como <strong>&quot;{name}&quot;</strong> — se ve asi en el splash de la web. Cambialo por el nombre real del negocio.</>
                  : <>El nombre del negocio esta vacio. Aparecera en blanco en el splash y en el header del cliente.</>}
              </div>
            );
          }
          return null;
        })()}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre del negocio" path="brand.name" value={getNested("brand.name")} onChange={updateNested} />
          <Field
            label="Tagline"
            path="brand.tagline"
            value={getNested("brand.tagline")}
            onChange={updateNested}
            placeholder={placeholderFor(lang, "tagline")}
            mismatchCheck={{ fieldId: `${clientId}:brand.tagline`, expected: lang }}
          />
        </div>
        <Field
          label="Descripcion (SEO)"
          path="brand.description"
          value={getNested("brand.description")}
          onChange={updateNested}
          placeholder={placeholderFor(lang, "description")}
          mismatchCheck={{ fieldId: `${clientId}:brand.description`, expected: lang }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <ImageUploadField aspectHint="SVG/PNG transparente · cuadrado" label="Logo (fondo claro)" value={(getNested("brand.logo") as string) || ""} onChange={(url) => updateNested("brand.logo", url ?? "")} clientId={clientId} />
          <ImageUploadField aspectHint="SVG/PNG transparente · cuadrado" label="Logo (fondo oscuro)" value={(getNested("brand.logoDark") as string) || ""} onChange={(url) => updateNested("brand.logoDark", url ?? "")} clientId={clientId} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ImageUploadField aspectHint="1.91:1 · 1200×630" label="OG Image" value={(getNested("brand.ogImage") as string) || ""} onChange={(url) => updateNested("brand.ogImage", url ?? "")} clientId={clientId} />
          <Field label="Icono fallback (Lucide)" path="brand.logoIconName" value={getNested("brand.logoIconName")} onChange={updateNested} placeholder="Scissors, Sparkles, Scale..." />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-muted">Favicon (emoji)</label>
            <input
              type="text"
              maxLength={4}
              value={(getNested("brand.faviconEmoji") as string) || ""}
              onChange={(e) => updateNested("brand.faviconEmoji", e.target.value)}
              placeholder="✂️"
              className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-center text-base text-text outline-none focus:border-accent"
            />
          </div>
          <p className="self-end pb-2 text-[10px] text-text-muted">
            Aparece en el tab del navegador. El template usa un emoji (no una imagen).
            Sugerencias por nicho: ✂️ barberia, 💅 nails, 🎨 tattoo, 🌸 estetica, ☕ cafeteria, 🔨 remodelaciones.
          </p>
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
          {SPLASH_VARIANTS.map(v => {
            const current = (getNested("splash.variant") as 1 | 2 | 3 | 4 | 5 | 6 | 7 | string) ?? 1;
            const isSelected = current === v.value;
            const currentNiche = normalizeBusinessNiche(config.business?.type || niche);
            const isRecommended = v.recommendedFor?.includes(currentNiche) ?? false;
            const requiresPrimary = v.requiresHeroPrimary;
            const hasPrimary = Boolean(
              (config.heroObjects?.primary?.src) ||
                (config.heroObjects?.primary?.composition?.length ?? 0) > 0,
            );
            const isDisabled = requiresPrimary && !hasPrimary;
            return (
              <button
                key={String(v.value)}
                type="button"
                onClick={() => {
                  if (isDisabled) return;
                  updateNested("splash.variant", v.value);
                }}
                disabled={isDisabled}
                title={isDisabled ? "Configura un Hero Object 'primary' arriba para habilitar esta variante 3D" : undefined}
                className={`group/splash relative rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "border-accent/40 bg-accent/8 ring-1 ring-accent/20"
                    : isDisabled
                      ? "cursor-not-allowed border-border/50 bg-bg-elevated/50 opacity-50"
                      : "border-border bg-bg-elevated hover:bg-bg-active"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                    isSelected ? "bg-accent text-white" : "bg-bg-active text-text-muted"
                  }`}>
                    {typeof v.value === "number" ? v.value : "3D"}
                  </div>
                  <span className={`text-xs font-semibold ${isSelected ? "text-text" : "text-text-secondary"}`}>{v.name}</span>
                  {v.badge && (
                    <span className="rounded-full bg-purple-500/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-purple-300">
                      {v.badge}
                    </span>
                  )}
                  {isRecommended && (
                    <span className="ml-auto rounded-full bg-accent/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-accent">
                      Recom.
                    </span>
                  )}
                </div>
                <p className="mt-1 pl-8 text-[10px] text-text-muted">{v.desc}</p>
                <SplashVariantPreview variant={v.value} />
                {isDisabled && (
                  <p className="mt-1.5 pl-8 text-[9px] text-amber-300/80">
                    Necesita un Hero Object &quot;primary&quot;.
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Variant-specific configs */}
        {(() => {
          const variant = getNested("splash.variant") as string | number | undefined;
          if (variant === "impact-scale") {
            return (
              <div className="space-y-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                <p className="text-[11px] font-semibold text-purple-300">
                  Config para Impact Scale
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="Bandas (3-9)"
                    path="splash.bandCount"
                    value={(getNested("splash.bandCount") as number) ?? 5}
                    onChange={(p, v) => {
                      const n = typeof v === "number" ? Math.min(9, Math.max(3, Math.round(v))) : 5;
                      updateNested(p, n);
                    }}
                  />
                  <SelectField
                    label="Direccion"
                    path="splash.bandDirection"
                    value={(getNested("splash.bandDirection") as string) ?? "vertical"}
                    onChange={updateNested}
                    options={[
                      { value: "vertical", label: "Vertical" },
                      { value: "horizontal", label: "Horizontal" },
                    ]}
                  />
                </div>
              </div>
            );
          }
          if (variant === "impact-split") {
            return (
              <div className="space-y-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                <p className="text-[11px] font-semibold text-purple-300">
                  Config para Impact Split
                </p>
                <SelectField
                  label="Direccion del split"
                  path="splash.splitDirection"
                  value={(getNested("splash.splitDirection") as string) ?? "horizontal"}
                  onChange={updateNested}
                  options={[
                    { value: "horizontal", label: "Horizontal" },
                    { value: "vertical", label: "Vertical" },
                  ]}
                />
              </div>
            );
          }
          if (variant === "impact-reveal-3d") {
            return (
              <div className="space-y-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                <p className="text-[11px] font-semibold text-purple-300">
                  Config para Impact Reveal 3D
                </p>
                <SelectField
                  label="Particulas (sobreescribe el slot)"
                  path="splash.ambientParticles"
                  value={(getNested("splash.ambientParticles") as string) ?? "sparkles"}
                  onChange={updateNested}
                  options={[
                    { value: "sparkles", label: "Chispas" },
                    { value: "bubbles", label: "Burbujas" },
                    { value: "smoke", label: "Humo" },
                    { value: "pearls", label: "Perlas" },
                    { value: "none", label: "Ninguna" },
                  ]}
                />
              </div>
            );
          }
          return null;
        })()}
      </Section>

      <GroupBand label="NEGOCIO" hint="quien es y como opera" />

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
          <ImageUploadField aspectHint="1:1 · 800px+" label="Foto de perfil" value={(getNested("owner.photo") as string) || ""} onChange={(url) => updateNested("owner.photo", url ?? "")} clientId={clientId} />
          <TextAreaField label="Bio" path="owner.bio" value={getNested("owner.bio") as string} onChange={updateNested}
            placeholder="Cuenta tu historia, tu trayectoria, que te hace diferente..."
            mismatchCheck={{ fieldId: `${clientId}:owner.bio`, expected: lang }}
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

      <GroupBand label="OPERACIONES" hint="features, reservas, pagos, notificaciones" />

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

      <GroupBand label="MEDIA" hint="imagenes, contenido visual, equipo y voz de los clientes" />

      {/* ── Images ──────────────────────────────────────────────────── */}
      <Section
        icon={ImageIcon} title="Imagenes" sectionKey="images"
        expanded={expandedSections.has("images")} onToggle={toggleSection}
      >
        {/* Hero background */}
        <div>
          <ImageUploadField
            label="Fondo del Hero"
            aspectHint="16:9 · 1920px ancho"
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

      </Section>

      {/* ══════════════════════════════════════════════════════════════
       * 3D IMPACT — heroObjects + section variants + ambient particles
       * ══════════════════════════════════════════════════════════════ */}
      <GroupBand label="3D IMPACT" hint="objetos transparentes, variantes 3D y particulas ambientales" />

      {!isImpactActivated(config) ? (
        <ImpactActivationCard
          onActivate={() => {
            // Seed an empty heroObjects map so the activation detector flips on.
            // The user then configures slots from the editor below it.
            setConfig((prev) => ({
              ...prev,
              heroObjects: prev.heroObjects ?? {},
            }));
            setExpandedSections((prev) => new Set([...prev, "heroObjects"]));
          }}
        />
      ) : (
        <>
      {/* ── Hero Objects (slot management) ──────────────────────────── */}
      <Section
        icon={Boxes} title="Hero Objects (PNG transparentes)" sectionKey="heroObjects"
        expanded={expandedSections.has("heroObjects")} onToggle={toggleSection}
      >
        <HeroObjectsEditor
          value={config.heroObjects}
          clientId={clientId}
          onChange={(next) => setConfig((prev) => ({ ...prev, heroObjects: next }))}
        />
      </Section>

      {/* ── Hero variant selector ───────────────────────────────────── */}
      <Section
        icon={Layout} title="Variante del Hero" sectionKey="heroVariant"
        expanded={expandedSections.has("heroVariant")} onToggle={toggleSection}
      >
        {(() => {
          const heroVariant = (config.heroVariant ?? "standard") as
            | "standard"
            | "slider"
            | "hero-3d-object";
          const slot = config.heroObjectSlot ?? "primary";
          const slotData = config.heroObjects?.[slot];
          const slotConfigured =
            !!slotData &&
            (Boolean(slotData.src) || (slotData.composition?.length ?? 0) > 0);
          const showSlotPicker = heroVariant === "hero-3d-object";
          return (
            <>
              <SectionVariantSelector
                label="Layout del Hero"
                hint="cambia la composicion entre las 3 variants disponibles"
                current={heroVariant}
                variants={HERO_VARIANTS}
                onChange={(next) => updateNested("heroVariant", next)}
                slotForActive={showSlotPicker ? slot : undefined}
                heroObjectsConfigured={slotConfigured}
              />
              {showSlotPicker && (
                <>
                  <HeroSlotPicker
                    label="Slot del objeto 3D del Hero"
                    value={slot}
                    onChange={(next) => updateNested("heroObjectSlot", next)}
                    heroObjects={config.heroObjects}
                  />
                  <ToggleField
                    label="Mostrar objeto 3D"
                    path="show3DObject"
                    value={getNested("show3DObject") as boolean ?? true}
                    onChange={updateNested}
                  />
                </>
              )}
            </>
          );
        })()}
      </Section>

      {/* ── Other section variant selectors ─────────────────────────── */}
      <Section
        icon={Layout} title="Variantes de seccion" sectionKey="sectionVariants"
        expanded={expandedSections.has("sectionVariants")} onToggle={toggleSection}
      >
        {/* Why Choose Us */}
        {(() => {
          const wcuVariant = (config.whyChooseUsVariant ?? "standard") as
            | "standard"
            | "icon-grid-3d";
          return (
            <SectionVariantSelector
              label="Por que elegirnos"
              hint="layout de la seccion de beneficios"
              current={wcuVariant}
              variants={WHY_CHOOSE_VARIANTS}
              onChange={(next) => updateNested("whyChooseUsVariant", next)}
            />
          );
        })()}

        <div className="border-t border-border pt-3" />

        {/* Services */}
        {(() => {
          const servicesVariant = (config.servicesVariant ?? "standard") as
            | "standard"
            | "list-with-icons"
            | "treatment-card-grid"
            | "card-stack-tabs";
          return (
            <div className="space-y-2.5">
              <SectionVariantSelector
                label="Servicios"
                hint="layout de la seccion de servicios"
                current={servicesVariant}
                variants={SERVICES_VARIANTS}
                onChange={(next) => updateNested("servicesVariant", next)}
              />
              {servicesVariant === "card-stack-tabs" && (
                <ServicesCardStackTabsEditor
                  value={config.variantConfigs?.servicesCardStackTabs}
                  onChange={(next) =>
                    setConfig((prev) => ({
                      ...prev,
                      variantConfigs: {
                        ...prev.variantConfigs,
                        servicesCardStackTabs: next,
                      },
                    }))
                  }
                />
              )}
            </div>
          );
        })()}

        <div className="border-t border-border pt-3" />

        {/* Gallery */}
        {(() => {
          const galleryVariant = (config.galleryVariant ?? "standard") as
            | "standard"
            | "bento-stats"
            | "grid-with-filters"
            | "portrait-bento-3d-cameo";
          const usesCameoSlot = galleryVariant === "portrait-bento-3d-cameo";
          const slot = config.galleryObjectSlot ?? "primary";
          const slotData = config.heroObjects?.[slot];
          const slotConfigured =
            !!slotData &&
            (Boolean(slotData.src) || (slotData.composition?.length ?? 0) > 0);
          const galleryUrls = (config.gallery as string[] | undefined) ?? [];
          return (
            <div className="space-y-2.5">
              <SectionVariantSelector
                label="Galeria"
                hint="layout de la galeria visual"
                current={galleryVariant}
                variants={GALLERY_VARIANTS}
                onChange={(next) => updateNested("galleryVariant", next)}
                slotForActive={usesCameoSlot ? slot : undefined}
                heroObjectsConfigured={slotConfigured}
              />
              {usesCameoSlot && (
                <HeroSlotPicker
                  label="Slot del cameo 3D"
                  value={slot}
                  onChange={(next) => updateNested("galleryObjectSlot", next)}
                  heroObjects={config.heroObjects}
                />
              )}
              {galleryVariant === "bento-stats" && (
                <GalleryBentoStatsEditor
                  value={config.variantConfigs?.galleryBentoStats}
                  onChange={(next) =>
                    setConfig((prev) => ({
                      ...prev,
                      variantConfigs: {
                        ...prev.variantConfigs,
                        galleryBentoStats: next,
                      },
                    }))
                  }
                />
              )}
              {galleryVariant === "grid-with-filters" && (
                <GalleryGridWithFiltersEditor
                  value={config.variantConfigs?.galleryGridWithFilters}
                  galleryUrls={galleryUrls}
                  onChange={(next) =>
                    setConfig((prev) => ({
                      ...prev,
                      variantConfigs: {
                        ...prev.variantConfigs,
                        galleryGridWithFilters: next,
                      },
                    }))
                  }
                />
              )}
              {galleryVariant === "portrait-bento-3d-cameo" && (
                <GalleryPortraitBentoCameoEditor
                  value={config.variantConfigs?.galleryPortraitBentoCameo}
                  onChange={(next) =>
                    setConfig((prev) => ({
                      ...prev,
                      variantConfigs: {
                        ...prev.variantConfigs,
                        galleryPortraitBentoCameo: next,
                      },
                    }))
                  }
                />
              )}
            </div>
          );
        })()}

        <div className="border-t border-border pt-3" />

        {/* Booking */}
        {(() => {
          const bookingVariant = (config.bookingVariant ?? "standard") as
            | "standard"
            | "form-map-hours-3d";
          return (
            <div className="space-y-2.5">
              <SectionVariantSelector
                label="Reservas / Contacto"
                hint="layout del bloque de contacto y reservas"
                current={bookingVariant}
                variants={BOOKING_VARIANTS}
                onChange={(next) => updateNested("bookingVariant", next)}
              />
              {bookingVariant === "form-map-hours-3d" && (
                <BookingFormMapHours3DEditor
                  value={config.variantConfigs?.bookingFormMapHours3D}
                  onChange={(next) =>
                    setConfig((prev) => ({
                      ...prev,
                      variantConfigs: {
                        ...prev.variantConfigs,
                        bookingFormMapHours3D: next,
                      },
                    }))
                  }
                />
              )}
            </div>
          );
        })()}
      </Section>

      {/* ── Global Ambient Particles override ──────────────────────── */}
      <Section
        icon={Sparkles} title="Particulas ambientales globales" sectionKey="globalAmbientParticles"
        expanded={expandedSections.has("globalAmbientParticles")} onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          Sobreescribe las particulas configuradas por cada Hero Object para que TODO el sitio use el mismo
          ambiente (humo en cafeteria, perlas en estetica, etc). Por default <strong>off</strong> — cada slot maneja las suyas.
        </p>
        <ToggleField
          label="Override global activo"
          path="globalAmbientParticles.enabled"
          value={(getNested("globalAmbientParticles.enabled") as boolean) ?? false}
          onChange={updateNested}
        />
        {(getNested("globalAmbientParticles.enabled") as boolean) && (
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Tipo de particulas"
              path="globalAmbientParticles.type"
              value={(getNested("globalAmbientParticles.type") as string) ?? "none"}
              onChange={updateNested}
              options={[
                { value: "none", label: "Ninguna" },
                { value: "bubbles", label: "Burbujas" },
                { value: "smoke", label: "Humo" },
                { value: "sparkles", label: "Chispas" },
                { value: "pearls", label: "Perlas" },
              ]}
            />
            <SelectField
              label="Densidad"
              path="globalAmbientParticles.density"
              value={(getNested("globalAmbientParticles.density") as string) ?? "subtle"}
              onChange={updateNested}
              options={[
                { value: "subtle", label: "Sutil" },
                { value: "medium", label: "Media" },
                { value: "strong", label: "Fuerte" },
              ]}
            />
          </div>
        )}
      </Section>
        </>
      )}

      {/* ── Why Choose Us (mainImage + badge + benefits) ──────────────── */}
      <Section
        icon={Award} title="Por que elegirnos" sectionKey="whyChooseUs"
        expanded={expandedSections.has("whyChooseUs")} onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          Seccion del template que resalta los diferenciales del negocio.
          Es lo primero que ve un visitante despues del Hero, junto con los servicios.
        </p>
        <ImageUploadField
          label="Imagen principal"
          aspectHint="4:5 vertical · o 1:1"
          value={(getNested("sections.whyChooseUs.mainImage") as string) || ""}
          onChange={(url) => updateNested("sections.whyChooseUs.mainImage", url ?? "")}
          clientId={clientId}
        />
        <Field
          label="Badge (texto chico sobre la imagen)"
          path="sections.whyChooseUs.badge"
          value={getNested("sections.whyChooseUs.badge")}
          onChange={updateNested}
          placeholder="Ej: Calidad premium"
        />
        <div className="border-t border-border pt-3">
          <p className="mb-2 text-[11px] font-semibold text-text-secondary">Beneficios (cards)</p>
          <BenefitsEditor
            value={config.sections?.whyChooseUs?.benefits}
            fieldIdPrefix={clientId}
            onChange={(next) =>
              setConfig((prev) => ({
                ...prev,
                sections: {
                  ...prev.sections,
                  whyChooseUs: { ...prev.sections?.whyChooseUs, benefits: next },
                },
              }))
            }
          />
        </div>
      </Section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <Section
        icon={Quote} title="Testimonios" sectionKey="testimonials"
        expanded={expandedSections.has("testimonials")} onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          Reviews de clientes reales. Se renderizan como carousel en la seccion Testimonios.
          Activable / desactivable desde &quot;Secciones visibles&quot;.
        </p>
        <TestimonialsEditor
          value={config.testimonials}
          fieldIdPrefix={clientId}
          onChange={(next) => setConfig((prev) => ({ ...prev, testimonials: next }))}
        />
      </Section>

      {/* ── Equipo (staff full CRUD) ───────────────────────────────────── */}
      {config.features?.showTeam && (
        <Section
          icon={Users} title="Equipo" sectionKey="staff"
          expanded={expandedSections.has("staff")} onToggle={toggleSection}
        >
          <p className="text-[11px] text-text-muted">
            Miembros del equipo del cliente. Aparecen en la seccion Equipo y, si las paginas de
            staff estan habilitadas, cada uno tiene una pagina propia con bio y portfolio.
          </p>
          <StaffEditor
            value={config.staff}
            onChange={(next) => setConfig((prev) => ({ ...prev, staff: next }))}
            clientId={clientId}
          />
        </Section>
      )}

      {/* ── Niche-specific sections ─────────────────────────────────── */}
      {(() => {
        const currentNiche = normalizeBusinessNiche(config.business?.type || niche);
        const showPhilosophy = currentNiche === "cafeteria";
        const showProcess = currentNiche === "cafeteria" || currentNiche === "remodelaciones";
        const showAmbience = currentNiche === "cafeteria";
        const showMenu = currentNiche === "cafeteria";
        const showPortfolio = currentNiche === "remodelaciones";
        if (!showPhilosophy && !showProcess && !showAmbience && !showMenu && !showPortfolio) {
          return null;
        }
        return (
          <>
            {showPhilosophy && (
              <Section
                icon={ListOrdered} title="Filosofia (pilares)" sectionKey="philosophy"
                expanded={expandedSections.has("philosophy")} onToggle={toggleSection}
              >
                <p className="text-[11px] text-text-muted">
                  Pilares que definen la identidad de la cafeteria. Cada uno se muestra como una
                  card numerada en la seccion Filosofia del cliente.
                </p>
                <NumberedStepsEditor
                  itemNoun="pilar"
                  value={config.sections?.philosophy?.pillars}
                  onChange={(next) => setConfig((prev) => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      philosophy: { ...prev.sections?.philosophy, pillars: next },
                    },
                  }))}
                />
              </Section>
            )}

            {showProcess && (
              <Section
                icon={ListOrdered} title="Proceso (pasos)" sectionKey="process"
                expanded={expandedSections.has("process")} onToggle={toggleSection}
              >
                <p className="text-[11px] text-text-muted">
                  Pasos del proceso del negocio. El template renderiza un icono Lucide por paso.
                </p>
                <NumberedStepsEditor
                  itemNoun="paso"
                  withIcon
                  value={config.sections?.process?.steps}
                  onChange={(next) => setConfig((prev) => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      process: { ...prev.sections?.process, steps: next },
                    },
                  }))}
                />
              </Section>
            )}

            {showAmbience && (
              <Section
                icon={Coffee} title="Ambiente (sectores)" sectionKey="ambience"
                expanded={expandedSections.has("ambience")} onToggle={toggleSection}
              >
                <p className="text-[11px] text-text-muted">
                  Sectores del local con foto + descripcion. Barra, mesas, terraza, etc.
                </p>
                <AmbienceEditor
                  value={config.sections?.ambience?.sectors}
                  onChange={(next) => setConfig((prev) => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      ambience: { ...prev.sections?.ambience, sectors: next },
                    },
                  }))}
                  clientId={clientId}
                />
              </Section>
            )}

            {showMenu && (
              <Section
                icon={UtensilsCrossed} title="Menu" sectionKey="menu"
                expanded={expandedSections.has("menu")} onToggle={toggleSection}
              >
                <p className="text-[11px] text-text-muted">
                  Carta de la cafeteria. Las categorias son los filtros que aparecen en la pagina
                  Menu, y cada item pertenece a una categoria.
                </p>
                <Field
                  label="Titulo de la seccion"
                  path="sections.menu.title"
                  value={getNested("sections.menu.title")}
                  onChange={updateNested}
                  placeholder="Nuestro menu"
                />
                <Field
                  label="Subtitulo"
                  path="sections.menu.subtitle"
                  value={getNested("sections.menu.subtitle")}
                  onChange={updateNested}
                />
                <MenuEditor
                  categories={config.sections?.menu?.categories}
                  items={config.sections?.menu?.items}
                  onCategoriesChange={(next) => setConfig((prev) => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      menu: { ...prev.sections?.menu, categories: next },
                    },
                  }))}
                  onItemsChange={(next) => setConfig((prev) => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      menu: { ...prev.sections?.menu, items: next },
                    },
                  }))}
                  clientId={clientId}
                />
              </Section>
            )}

            {showPortfolio && (
              <Section
                icon={Hammer} title="Portfolio (proyectos)" sectionKey="portfolio"
                expanded={expandedSections.has("portfolio")} onToggle={toggleSection}
              >
                <p className="text-[11px] text-text-muted">
                  Proyectos de remodelacion con filtros, imagenes y pares antes/despues
                  opcionales.
                </p>
                <PortfolioEditor
                  filters={config.sections?.portfolio?.filters}
                  projects={config.sections?.portfolio?.projects}
                  onFiltersChange={(next) => setConfig((prev) => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      portfolio: { ...prev.sections?.portfolio, filters: next },
                    },
                  }))}
                  onProjectsChange={(next) => setConfig((prev) => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      portfolio: { ...prev.sections?.portfolio, projects: next },
                    },
                  }))}
                  clientId={clientId}
                />
              </Section>
            )}
          </>
        );
      })()}

      <GroupBand label="AVANZADO" hint="servicios, chatbot y personalizacion fina" />

      {/* ── Services (combined visibility + overrides + custom CRUD) ──── */}
      <Section
        icon={Briefcase} title="Servicios" sectionKey="services"
        expanded={expandedSections.has("services")} onToggle={toggleSection}
      >
        <ServicesEditor
          niche={normalizeBusinessNiche(config.business?.type || niche)}
          config={config}
          setConfig={setConfig}
          clientId={clientId}
        />
      </Section>

      {/* ── AI Persona (chatbot) ──────────────────────────────────────── */}
      <Section
        icon={Bot} title="Chatbot IA" sectionKey="ai"
        expanded={expandedSections.has("ai")} onToggle={toggleSection}
      >
        <p className="text-[11px] text-text-muted">
          El chatbot recibe automaticamente los servicios, precios, horarios y contacto del negocio. Este campo es solo para definir el tono y personalidad.
        </p>
        <TextAreaField label="Persona del chatbot (opcional)" path="brand.aiPersona" value={getNested("brand.aiPersona") as string} onChange={updateNested}
          placeholder={placeholderFor(lang, "aiPersona")}
          mismatchCheck={{ fieldId: `${clientId}:brand.aiPersona`, expected: lang }}
        />
      </Section>

      <SaveDiffModal
        open={diffModalOpen}
        before={originalConfigRef.current}
        after={config}
        saving={saving}
        onCancel={() => { if (!saving) setDiffModalOpen(false); }}
        onConfirm={handleConfirmedSave}
      />
    </div>
    </ClientLanguageProvider>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Sub-components
 * ══════════════════════════════════════════════════════════════════════════ */

function GroupBand({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2 pt-2 first:pt-0">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted/80">
        {label}
      </h3>
      {hint && (
        <span className="text-[10px] text-text-muted/50">{hint}</span>
      )}
      <div className="ml-1 h-px flex-1 bg-border/50" />
    </div>
  );
}

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

function Field({ label, path, value, onChange, placeholder, mismatchCheck }: {
  label: string; path: string; value: unknown; onChange: (path: string, value: unknown) => void; placeholder?: string;
  mismatchCheck?: { fieldId: string; expected: ClientLanguage };
}) {
  const stringValue = (value as string) ?? "";
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-text-muted">{label}</label>
      <input
        type="text"
        value={stringValue}
        onChange={e => onChange(path, e.target.value || null)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
      />
      {mismatchCheck && (
        <LanguageMismatchWarning
          fieldId={mismatchCheck.fieldId}
          text={stringValue}
          expected={mismatchCheck.expected}
        />
      )}
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

function TextAreaField({ label, path, value, onChange, placeholder, mismatchCheck }: {
  label: string; path: string; value: string | undefined; onChange: (path: string, value: unknown) => void; placeholder?: string;
  mismatchCheck?: { fieldId: string; expected: ClientLanguage };
}) {
  const stringValue = value || "";
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-text-muted">{label}</label>
      <textarea
        value={stringValue}
        onChange={e => onChange(path, e.target.value || null)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
      />
      {mismatchCheck && (
        <LanguageMismatchWarning
          fieldId={mismatchCheck.fieldId}
          text={stringValue}
          expected={mismatchCheck.expected}
        />
      )}
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

/* ══════════════════════════════════════════════════════════════════════════
 * 3D Impact activation
 *
 * A client is considered "activated" as soon as they have at least one
 * heroObjects key OR any variant field set to a non-standard value OR an
 * impact-* splash variant. This means simply seeding `heroObjects: {}`
 * activates the system — but emptying it again returns to the welcome
 * card without persisting any 3D state.
 * ══════════════════════════════════════════════════════════════════════════ */

function isImpactActivated(cfg: ConfigDoc): boolean {
  if (cfg.heroObjects && Object.keys(cfg.heroObjects).length > 0) return true;
  // `heroObjects: {}` itself counts as opted-in even if no slots are configured.
  if (cfg.heroObjects && Object.keys(cfg.heroObjects).length === 0) return true;
  if (cfg.heroVariant && cfg.heroVariant !== "standard") return true;
  if (cfg.whyChooseUsVariant && cfg.whyChooseUsVariant !== "standard") return true;
  if (cfg.servicesVariant && cfg.servicesVariant !== "standard") return true;
  if (cfg.galleryVariant && cfg.galleryVariant !== "standard") return true;
  if (cfg.bookingVariant && cfg.bookingVariant !== "standard") return true;
  if (cfg.globalAmbientParticles?.enabled) return true;
  const variant = cfg.splash?.variant;
  if (typeof variant === "string" && variant.startsWith("impact-")) return true;
  return false;
}

function ImpactActivationCard({ onActivate }: { onActivate: () => void }) {
  return (
    <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-bg-card p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-700/20 text-purple-200"
          aria-hidden
        >
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-text">Sistema 3D Impact</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
            Reemplaza el render clasico por objetos 3D parallax, splash variants con depth,
            galerias bento y particulas ambientales. Es <strong>opt-in</strong>: clientes que
            no lo usan siguen viendo el render legacy sin diferencias.
          </p>
          <ul className="mt-2 space-y-0.5 text-[10px] text-text-muted/80">
            <li>· Hero Objects: PNGs transparentes con composition multi-layer.</li>
            <li>· Splash 3D: impact-scale, impact-split, impact-reveal-3d.</li>
            <li>· Variants por seccion: hero, why-choose, servicios, galeria, reservas.</li>
            <li>· Particulas ambientales: burbujas, humo, chispas, perlas.</li>
          </ul>
          <button
            type="button"
            onClick={onActivate}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-transform hover:scale-[1.02]"
          >
            <Sparkles size={12} />
            Activar 3D Impact
          </button>
          <p className="mt-2 text-[10px] text-text-muted/60">
            La activacion solo crea el espacio de configuracion — nada se aplica al sitio hasta que guardes
            con una variante 3D o un slot configurado.
          </p>
        </div>
      </div>
    </div>
  );
}
