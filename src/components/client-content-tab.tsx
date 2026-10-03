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
  CLIENT_LANGUAGE_LABELS_ES,
  normalizeClientLanguage,
} from "@/lib/client-language";
import { SelectorIdioma } from "@/components/selector-idioma";
import {
  placeholderFor,
  type PlaceholderKey,
} from "@/lib/dashboard-placeholders";
import { LanguageMismatchWarning } from "./language-mismatch-warning";

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
      // CONEXION-06 (D-72): el eyebrow va arriba del titular; el hero v6 lo recorta a 4 palabras (clampWords) y la flota lo rinde igual.
      { path: "hero.eyebrow", label: "Eyebrow (≤ 4 palabras)", type: "text" },
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
    // CONTACTO-PIE-01 (D-205, inciso v): contacto y el pie leen la dirección y la línea de la marca en cada idioma
    // (`translations.<lang>.contact.address`, `translations.<lang>.brand.tagline`); en el idioma base escribe la raíz, como la pestaña Config.
    key: "address",
    label: "Direccion y linea de la marca",
    fields: [
      { path: "contact.address.street", label: "Calle", type: "text" },
      { path: "contact.address.district", label: "Barrio", type: "text" },
      { path: "contact.address.cityStateZip", label: "Ciudad", type: "text" },
      { path: "brand.tagline", label: "Linea de la marca (pie de pagina)", type: "text" },
      // CIERRE-TRAMO-01 (D-219): la descripción la leen el SEO y «sobre nosotros» en cada idioma (`translations.<lang>.brand.description`).
      { path: "brand.description", label: "Descripcion de la marca (SEO y sobre nosotros)", type: "textarea" },
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

/** Las secciones y campos de la pestaña Contenido para un nicho (CONTACTO-PIE-01, C5: exportada para ejecutar el camino sin navegador). */
export function seccionesDeContenido(niche: string): ContentSection[] {
  const sections = [...BASE_SECTIONS];
  if (niche === "cafeteria") sections.push(...CAFETERIA_SECTIONS);
  if (niche === "remodelaciones") sections.push(...REMODELACIONES_SECTIONS);
  sections.push(FAQ_SECTION);
  return sections;
}

/** Lo que la pestaña muestra para `idioma`: los campos de texto de la raíz (idioma base) o de `translations.<idioma>`, aplanados por ruta. */
export function contenidoDeCapa(config: Record<string, unknown>, niche: string, idioma: string, esBase: boolean): Record<string, string> {
  const fuente = esBase ? config : getNestedValue(config, `translations.${idioma}`);
  const capa = fuente && typeof fuente === "object" ? (fuente as Record<string, unknown>) : {};
  const flat: Record<string, string> = {};
  for (const section of seccionesDeContenido(niche)) {
    for (const field of section.fields) {
      const val = getNestedValue(capa, field.path);
      if (typeof val === "string") flat[field.path] = val;
    }
  }
  return flat;
}

/**
 * El cuerpo del PUT que manda «Guardar» (sin el FAQ): sólo los campos cuyo valor difiere de `previa` (lo cargado) — CIERRE-TRAMO-01
 * (D-220): mandar los que no se tocaron devolvía a su valor viejo lo que otra pestaña guardó entre la carga y el guardado. En el idioma
 * base, la raíz (vaciar manda `""`); en otro, `{ translations: { <idioma>: … } }`, y vaciar lo que ya estaba traducido manda `null`
 * (null → FieldValue.delete: vuelve al idioma base o al preset de ese idioma). Sin cambios, `{}` (un `{ translations: { <lang>: {} } }`
 * borraba la capa entera en Firestore, IDIOMAS-01).
 */
export function parcheDeContenido(content: Record<string, string>, previa: Record<string, string>, esBase: boolean, idioma: string): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(content)) {
    if (value === undefined || value === (previa[path] ?? "")) continue;
    if (esBase || value.trim()) setNestedValue(patch, path, value);
    else if (previa[path] !== undefined) setNestedValue(patch, path, null);
  }
  return enCapa(patch, esBase, idioma);
}

/** El trozo del cuerpo del FAQ (D-220): las preguntas no vacías, sólo si difieren de `previos` (lo cargado); sin cambios, `{}`. */
export function faqDeContenido(items: FaqItem[], previos: unknown[], esBase: boolean, idioma: string): Record<string, unknown> {
  const llenos = items.filter((i) => i.question.trim() || i.answer.trim());
  if (JSON.stringify(llenos) === JSON.stringify(previos)) return {};
  return enCapa({ sections: { faq: { items: llenos } } }, esBase, idioma);
}

/** El cuerpo entero que manda «Guardar» (`handleSave`): los campos y el FAQ que cambiaron respecto de `cargado` (lo último leído o guardado). */
export function cuerpoDeContenido(cargado: Record<string, unknown>, content: Record<string, string>, faqItems: FaqItem[], niche: string, idioma: string, esBase: boolean): Record<string, unknown> {
  const capa = esBase ? cargado : getNestedValue(cargado, `translations.${idioma}`);
  const faq = capa && typeof capa === "object" ? getNestedValue(capa as Record<string, unknown>, "sections.faq.items") : undefined;
  return fundir(
    parcheDeContenido(content, contenidoDeCapa(cargado, niche, idioma, esBase), esBase, idioma),
    faqDeContenido(faqItems, Array.isArray(faq) ? faq : [], esBase, idioma),
  );
}

function enCapa(patch: Record<string, unknown>, esBase: boolean, idioma: string): Record<string, unknown> {
  if (Object.keys(patch).length === 0) return {};
  return esBase ? patch : { translations: { [idioma]: patch } };
}

/** Funde dos cuerpos de guardado (mapas anidados; lo demás de `b` reemplaza). */
function fundir(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const x = out[k];
    out[k] = x && v && typeof x === "object" && typeof v === "object" && !Array.isArray(x) && !Array.isArray(v)
      ? fundir(x as Record<string, unknown>, v as Record<string, unknown>) : v;
  }
  return out;
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
  // BLOQUE-04 · 4.2: idioma que se edita. Base (= idioma del cliente) escribe la raíz de
  // config/{id}; otro idioma lee/escribe config.translations[lang] con el mismo set merge.
  const [editLang, setEditLang] = useState<ClientLanguage>(lang);
  const isBase = editLang === lang;
  const [rawConfig, setRawConfig] = useState<Record<string, unknown>>({});
  const [content, setContent] = useState<Record<string, string>>({});
  const [baseContent, setBaseContent] = useState<Record<string, string>>({});
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // IDIOMAS-01: mientras llega el GET del idioma, lo escrito se pisa al llegar; guardar en ese hueco mandaba un parche vacío.
  const [cargandoIdioma, setCargandoIdioma] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["hero"]));
  const [generating, setGenerating] = useState(false);
  const [businessDesc, setBusinessDesc] = useState("");

  const sections = useMemo(() => seccionesDeContenido(niche), [niche]);

  const flatten = useCallback((source: Record<string, unknown>) => contenidoDeCapa(source, niche, lang, true), [niche, lang]);

  /** Raíz para el idioma base; `translations[lang]` (o vacío) para los demás. */
  const layerFor = useCallback((config: Record<string, unknown>, target: ClientLanguage): Record<string, unknown> => {
    if (target === lang) return config;
    const layer = getNestedValue(config, `translations.${target}`);
    return layer && typeof layer === "object" ? (layer as Record<string, unknown>) : {};
  }, [lang]);

  const fetchContent = useCallback(async () => {
    setCargandoIdioma(true);
    try {
      const res = await fetch(`/api/config/${clientId}`);
      const config = (await res.json()) as Record<string, unknown>;
      setRawConfig(config);
      setBaseContent(flatten(config));
      const layer = layerFor(config, editLang);
      setContent(flatten(layer));
      const faq = getNestedValue(layer, "sections.faq.items");
      setFaqItems(Array.isArray(faq) ? faq : []);
    } catch {
      setError("Error al cargar contenido");
    } finally {
      setLoading(false);
      setCargandoIdioma(false);
    }
  }, [clientId, editLang, flatten, layerFor]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  function switchEditLang(next: ClientLanguage) {
    if (next === editLang) return;
    setEditLang(next);
    setSaved(false);
    const layer = layerFor(rawConfig, next);
    setContent(flatten(layer));
    const faq = getNestedValue(layer, "sections.faq.items");
    setFaqItems(Array.isArray(faq) ? faq : []);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      // CONTACTO-PIE-01 (C5): el cuerpo lo arma `parcheDeContenido` (vaciar una traducción la borra: null → FieldValue.delete).
      // CIERRE-TRAMO-01 (D-220): sólo lo que cambió respecto de lo cargado, también el FAQ (`faqDeContenido`).
      const patch = cuerpoDeContenido(rawConfig, content, faqItems, niche, editLang, isBase);
      // IDIOMAS-01: sin cambios no se manda nada (un `{ translations: { <lang>: {} } }` borraba la capa entera en Firestore).
      if (Object.keys(patch).length === 0) return;
      const res = await fetch(`/api/config/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Error al guardar");
      // Reflejar lo guardado en el snapshot local para que el cambio de idioma no lo pierda.
      setRawConfig(prev => {
        const next = structuredClone(prev);
        const target = isBase ? next : ((getNestedValue(next, `translations.${editLang}`) as Record<string, unknown> | undefined) ?? (() => { setNestedValue(next, `translations.${editLang}`, {}); return getNestedValue(next, `translations.${editLang}`) as Record<string, unknown>; })());
        for (const [path, value] of Object.entries(content)) {
          if (value === undefined) continue;
          if (isBase || value.trim()) setNestedValue(target, path, value); else deleteNestedValue(target, path);
        }
        const faqGuardado = getNestedValue(patch, isBase ? "sections.faq.items" : `translations.${editLang}.sections.faq.items`);
        if (faqGuardado) setNestedValue(target, "sections.faq.items", faqGuardado);
        if (isBase) setBaseContent(flatten(next));
        return next;
      });
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
    <ClientLanguageProvider language={editLang}>
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
          <p className="text-[11px] text-text-muted">
            {isBase
              ? "Edita todos los textos de la landing page"
              : `Traducción a ${CLIENT_LANGUAGE_LABELS_ES[editLang]}: lo que dejes vacío se muestra con el texto del nicho en ese idioma`}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || cargandoIdioma}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {/* Idioma del texto que se edita (base = raíz de config; otro = translations[lang]) */}
      <SelectorIdioma idioma={editLang} base={lang} onCambio={switchEditLang} conCapa={(code) => !!getNestedValue(rawConfig, `translations.${code}`)} />

      {error && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
      {saved && <div className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">Contenido guardado correctamente</div>}

      {/* AI Generation Card — sólo en el idioma base (la traducción asistida viene después del bloque 4) */}
      {isBase && <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
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
      </div>}

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
                const ph = field.placeholderKey ? placeholderFor(editLang, field.placeholderKey) : undefined;
                const value = content[field.path] || "";
                const baseValue = !isBase ? baseContent[field.path] : undefined;
                return (
                <div key={field.path}>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={value}
                      onChange={e => setContent(prev => ({ ...prev, [field.path]: e.target.value }))}
                      placeholder={ph}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={e => setContent(prev => ({ ...prev, [field.path]: e.target.value }))}
                      placeholder={ph}
                      className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
                    />
                  )}
                  {baseValue && (
                    <p className="mt-1 text-[10px] text-text-muted/80" dir="auto">
                      <span className="font-medium">{CLIENT_LANGUAGE_LABELS_ES[lang]}:</span> {baseValue}
                    </p>
                  )}
                  <LanguageMismatchWarning
                    fieldId={`${clientId}:content:${editLang}:${field.path}`}
                    text={value}
                    expected={editLang}
                  />
                </div>
                );
              })}
              {section.key === "faq" && (
                <FaqEditor clientId={clientId} items={faqItems} onChange={setFaqItems} lang={editLang} />
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
  clientId,
  items,
  onChange,
  lang,
}: {
  clientId: string;
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
            <LanguageMismatchWarning
              fieldId={`${clientId}:faq:${i}:question`}
              text={item.question}
              expected={lang}
            />
          </div>
          <textarea
            value={item.answer}
            onChange={e => updateItem(i, "answer", e.target.value)}
            placeholder={answerPh}
            rows={2}
            className="w-full rounded border border-border bg-bg px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
          />
          <LanguageMismatchWarning
            fieldId={`${clientId}:faq:${i}:answer`}
            text={item.answer}
            expected={lang}
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

function deleteNestedValue(obj: Record<string, unknown>, path: string) {
  const keys = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (const k of keys.slice(0, -1)) {
    const next = cur[k];
    if (!next || typeof next !== "object") return;
    cur = next as Record<string, unknown>;
  }
  delete cur[keys[keys.length - 1]];
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
