"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";
import { ClientLanguageBanner } from "./client-language-banner";
import { ClientLanguageProvider } from "@/lib/client-language-context";
import {
  type ClientLanguage,
  normalizeClientLanguage,
} from "@/lib/client-language";
import {
  placeholderFor,
  type PlaceholderKey,
} from "@/lib/dashboard-placeholders";

interface ContentSection {
  key: string;
  label: string;
  fields: ContentField[];
}

interface ContentField {
  path: string;
  label: string;
  type: "text" | "textarea";
  /** Clave en el dict de placeholders. La UI traduce según el idioma del cliente. */
  placeholderKey?: PlaceholderKey;
}

const BASE_SECTIONS: ContentSection[] = [
  {
    key: "hero",
    label: "Hero",
    fields: [
      { path: "hero.titlePrefix", label: "Prefijo del titulo", type: "text", placeholderKey: "heroTitlePrefix" },
      { path: "hero.titleHighlight", label: "Titulo destacado", type: "text", placeholderKey: "heroTitleHighlight" },
      { path: "hero.titleSuffix", label: "Sufijo del titulo", type: "text" },
      { path: "hero.subtitle", label: "Subtitulo", type: "textarea", placeholderKey: "heroSubtitle" },
      { path: "hero.ctaPrimary", label: "Boton principal (CTA)", type: "text", placeholderKey: "heroCtaPrimary" },
      { path: "hero.ctaSecondary", label: "Boton secundario", type: "text", placeholderKey: "heroCtaSecondary" },
    ],
  },
  {
    key: "services",
    label: "Servicios",
    fields: [
      { path: "sections.services.title", label: "Titulo de seccion", type: "text", placeholderKey: "servicesTitle" },
      { path: "sections.services.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "whyChooseUs",
    label: "Por que elegirnos",
    fields: [
      { path: "sections.whyChooseUs.title", label: "Titulo", type: "text", placeholderKey: "whyChooseUsTitle" },
      { path: "sections.whyChooseUs.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "team",
    label: "Equipo",
    fields: [
      { path: "sections.team.title", label: "Titulo", type: "text", placeholderKey: "teamTitle" },
      { path: "sections.team.subtitle", label: "Subtitulo", type: "text" },
      { path: "sections.team.description", label: "Descripcion", type: "textarea" },
    ],
  },
  {
    key: "testimonials",
    label: "Testimonios",
    fields: [
      { path: "sections.testimonials.title", label: "Titulo", type: "text", placeholderKey: "testimonialsTitle" },
      { path: "sections.testimonials.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "gallery",
    label: "Galeria",
    fields: [
      { path: "sections.gallery.title", label: "Titulo", type: "text", placeholderKey: "galleryTitle" },
      { path: "sections.gallery.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "location",
    label: "Ubicacion",
    fields: [
      { path: "sections.location.title", label: "Titulo", type: "text", placeholderKey: "locationTitle" },
      { path: "sections.location.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "contact",
    label: "Contacto",
    fields: [
      { path: "sections.contact.title", label: "Titulo", type: "text", placeholderKey: "contactTitle" },
      { path: "sections.contact.subtitle", label: "Subtitulo", type: "text" },
      { path: "sections.contact.description", label: "Descripcion", type: "textarea" },
    ],
  },
  {
    key: "booking",
    label: "Reservas",
    fields: [
      { path: "sections.booking.title", label: "Titulo", type: "text", placeholderKey: "bookingTitle" },
      { path: "sections.booking.tagline", label: "Tagline", type: "text", placeholderKey: "bookingTagline" },
    ],
  },
];

const CAFETERIA_SECTIONS: ContentSection[] = [
  {
    key: "philosophy",
    label: "Filosofia",
    fields: [
      { path: "sections.philosophy.title", label: "Titulo", type: "text", placeholderKey: "philosophyTitle" },
      { path: "sections.philosophy.subtitle", label: "Subtitulo", type: "text" },
      { path: "sections.philosophy.intro", label: "Introduccion", type: "textarea" },
    ],
  },
  {
    key: "process",
    label: "Proceso",
    fields: [
      { path: "sections.process.title", label: "Titulo", type: "text", placeholderKey: "processTitle" },
      { path: "sections.process.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "ambience",
    label: "Ambiente",
    fields: [
      { path: "sections.ambience.title", label: "Titulo", type: "text", placeholderKey: "ambienceTitle" },
      { path: "sections.ambience.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
];

const REMODELACIONES_SECTIONS: ContentSection[] = [
  {
    key: "portfolio",
    label: "Portfolio",
    fields: [
      { path: "sections.portfolio.title", label: "Titulo", type: "text", placeholderKey: "portfolioTitle" },
      { path: "sections.portfolio.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "process",
    label: "Proceso",
    fields: [
      { path: "sections.process.title", label: "Titulo", type: "text", placeholderKey: "processTitle" },
      { path: "sections.process.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
];

const FAQ_SECTION: ContentSection = {
  key: "faq",
  label: "Preguntas Frecuentes (FAQ)",
  fields: [
    { path: "sections.faq.title", label: "Titulo", type: "text", placeholderKey: "faqTitle" },
    { path: "sections.faq.subtitle", label: "Subtitulo", type: "text", placeholderKey: "faqSubtitle" },
  ],
};

function getSections(niche: string): ContentSection[] {
  const sections = [...BASE_SECTIONS];
  if (niche === "cafeteria") sections.push(...CAFETERIA_SECTIONS);
  if (niche === "remodelaciones") sections.push(...REMODELACIONES_SECTIONS);
  sections.push(FAQ_SECTION);
  return sections;
}

interface FaqItem {
  question: string;
  answer: string;
}

export function ClientContentTab({
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
  const [content, setContent] = useState<Record<string, string>>({});
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["hero"]));
  const [generating, setGenerating] = useState(false);
  const [businessDesc, setBusinessDesc] = useState("");

  const sections = useMemo(() => getSections(niche), [niche]);

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/config/${clientId}`);
      const config = await res.json();
      const flat: Record<string, string> = {};
      for (const section of sections) {
        for (const field of section.fields) {
          const val = getNestedValue(config, field.path);
          if (typeof val === "string") flat[field.path] = val;
        }
      }
      setContent(flat);
      const faq = getNestedValue(config, "sections.faq.items");
      if (Array.isArray(faq)) setFaqItems(faq);
    } catch {
      setError("Error al cargar contenido");
    } finally {
      setLoading(false);
    }
  }, [clientId, sections]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const patch: Record<string, unknown> = {};
      for (const [path, value] of Object.entries(content)) {
        if (value !== undefined) setNestedValue(patch, path, value);
      }
      if (faqItems.length > 0) {
        setNestedValue(patch, "sections.faq.items", faqItems.filter(i => i.question.trim() || i.answer.trim()));
      }
      const res = await fetch(`/api/config/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!businessDesc.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, niche, businessDescription: businessDesc }),
      });
      if (!res.ok) throw new Error("Error al generar contenido");
      const generated = await res.json();
      setContent(prev => ({ ...prev, ...generated }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setGenerating(false);
    }
  }

  function toggleSection(key: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
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
          <h2 className="text-sm font-semibold text-text">Contenido del sitio</h2>
          <p className="text-[11px] text-text-muted">Edita todos los textos de la landing page</p>
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

      {error && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
      {saved && <div className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">Contenido guardado correctamente</div>}

      {/* AI Generation Card */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-xs font-semibold text-text">Generar contenido con IA</span>
        </div>
        <textarea
          value={businessDesc}
          onChange={e => setBusinessDesc(e.target.value)}
          placeholder={placeholderFor(lang, "businessDescription")}
          rows={3}
          className="mb-3 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleGenerate}
          disabled={generating || !businessDesc.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? "Generando..." : "Generar textos"}
        </button>
      </div>

      {/* Content Sections */}
      {sections.map(section => (
        <div key={section.key} className="rounded-xl border border-border bg-bg-card">
          <button
            type="button"
            onClick={() => toggleSection(section.key)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left"
          >
            <span className="flex-1 text-xs font-semibold text-text">{section.label}</span>
            {expandedSections.has(section.key)
              ? <ChevronDown size={14} className="text-text-muted" />
              : <ChevronRight size={14} className="text-text-muted" />
            }
          </button>
          {expandedSections.has(section.key) && (
            <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
              {section.fields.map(field => {
                const ph = field.placeholderKey ? placeholderFor(lang, field.placeholderKey) : undefined;
                return (
                <div key={field.path}>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={content[field.path] || ""}
                      onChange={e => setContent(prev => ({ ...prev, [field.path]: e.target.value }))}
                      placeholder={ph}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={content[field.path] || ""}
                      onChange={e => setContent(prev => ({ ...prev, [field.path]: e.target.value }))}
                      placeholder={ph}
                      className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
                    />
                  )}
                </div>
                );
              })}
              {section.key === "faq" && (
                <FaqEditor items={faqItems} onChange={setFaqItems} lang={lang} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
    </ClientLanguageProvider>
  );
}

function FaqEditor({
  items,
  onChange,
  lang,
}: {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
  lang: ClientLanguage;
}) {
  function addItem() {
    onChange([...items, { question: "", answer: "" }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: "question" | "answer", value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  const questionPh = placeholderFor(lang, "faqQuestion");
  const answerPh = placeholderFor(lang, "faqAnswer");

  return (
    <div className="space-y-3">
      <label className="mb-1 block text-[11px] font-medium text-text-muted">Preguntas y respuestas</label>
      {items.map((item, i) => (
        <div key={i} className="relative rounded-lg border border-border/60 bg-bg-elevated p-3">
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="absolute end-2 top-2 rounded p-1 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={12} />
          </button>
          <div className="mb-2">
            <input
              type="text"
              value={item.question}
              onChange={e => updateItem(i, "question", e.target.value)}
              placeholder={questionPh}
              className="w-full rounded border border-border bg-bg px-2.5 py-1.5 text-xs font-medium text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
            />
          </div>
          <textarea
            value={item.answer}
            onChange={e => updateItem(i, "answer", e.target.value)}
            placeholder={answerPh}
            rows={2}
            className="w-full rounded border border-border bg-bg px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={12} />
        Agregar pregunta
      </button>
    </div>
  );
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}
