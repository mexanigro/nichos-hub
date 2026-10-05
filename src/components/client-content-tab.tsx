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
import { placeholderFor } from "@/lib/dashboard-placeholders";
import { LanguageMismatchWarning } from "./language-mismatch-warning";
import { seccionesDeContenido } from "@/lib/secciones-contenido";
import { PropuestaDeTextos } from "./propuesta-textos";
import { cuerpoDePropuesta, descartadosDePropuesta, MODELO_TEXTOS, type Llamada, type Propuesta } from "@/lib/textos-claude";
import type { ConfigIssue } from "@/lib/config-validator";

// ALTA-IDIOMAS-01: la lista vive en src/lib (la usa también la ruta de servidor); se reexporta para los que la leen de aquí.
export { seccionesDeContenido };

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
  // ALTA-IDIOMAS-01 (G1): la propuesta de Claude en los cuatro idiomas; se guarda sólo lo que el dueño acepta.
  const [generating, setGenerating] = useState(false);
  const [notas, setNotas] = useState("");
  const [propuesta, setPropuesta] = useState<{ propuesta: Propuesta; errores: ConfigIssue[]; llamadas: Llamada[] } | null>(null);
  const [aceptados, setAceptados] = useState<string[]>([]);
  const [guardandoPropuesta, setGuardandoPropuesta] = useState(false);
  // PLANTILLA-01 (D-258): lo aceptado que no se guardó, con su motivo; se muestra en la propuesta.
  const [descartados, setDescartados] = useState<ConfigIssue[]>([]);

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
    setGenerating(true);
    setError("");
    setPropuesta(null);
    setAceptados([]);
    setDescartados([]);
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, niche, base: lang, notas }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r?.error ?? "Error al generar la propuesta");
      setPropuesta(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setGenerating(false);
    }
  }

  /** Guarda lo aceptado con el PUT de siempre (D-242). El cuerpo se arma sobre el config recién leído: lo que otra pestaña guardó
   *  mientras tanto queda como está, y un campo que ya tiene texto sale como error y no se manda. */
  async function guardarPropuesta() {
    if (!propuesta) return;
    setGuardandoPropuesta(true);
    setError("");
    try {
      const actual = (await (await fetch(`/api/config/${clientId}`)).json()) as Record<string, unknown>;
      // Con las notas de la clienta (D-258): un número que sólo dio en las notas entra; lo que no entra se dice.
      const cuerpo = cuerpoDePropuesta(actual, niche, lang, propuesta.propuesta, aceptados, notas);
      const fuera = descartadosDePropuesta(actual, niche, lang, propuesta.propuesta, aceptados, notas);
      setDescartados(fuera);
      if (Object.keys(cuerpo).length === 0) return;
      const res = await fetch(`/api/config/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Error al guardar la propuesta");
      // Si algo aceptado no se guardó, la propuesta queda a la vista con el aviso de qué y por qué.
      if (fuera.length === 0) setPropuesta(null);
      setAceptados([]);
      await fetchContent();
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la propuesta");
    } finally {
      setGuardandoPropuesta(false);
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

      {/* ALTA-IDIOMAS-01: Claude propone los textos que faltan en los cuatro idiomas; el dueño acepta campo por campo. */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-xs font-semibold text-text">Escribir los textos con IA (4 idiomas)</span>
        </div>
        <p className="mb-3 text-[11px] text-text-muted">
          Propone sólo lo que está vacío, en hebreo, inglés, ruso y árabe, cada idioma como original. Nada se guarda hasta que lo aceptes.
        </p>
        <label htmlFor="notas-ia" className="mb-1 block text-[11px] font-medium text-text-muted">Lo que contó la clienta (opcional)</label>
        <textarea
          id="notas-ia"
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder={placeholderFor(lang, "businessDescription")}
          rows={3}
          className="mb-3 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? "Escribiendo (puede tardar unos minutos)..." : "Proponer textos"}
        </button>
        {propuesta && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { const malos = new Set(propuesta.errores.filter((e) => e.severity === "error").map((e) => e.path)); setAceptados(Object.entries(propuesta.propuesta).flatMap(([l, t]) => Object.keys(t).map((r) => `${l}:${r}`)).filter((c) => !malos.has(c))); }}
                className="rounded-lg border border-border px-3 py-1.5 text-[11px] text-text-muted hover:border-accent hover:text-accent"
              >
                Marcar todos los válidos
              </button>
              <button
                type="button"
                onClick={() => setAceptados([])}
                className="rounded-lg border border-border px-3 py-1.5 text-[11px] text-text-muted hover:border-accent hover:text-accent"
              >
                Desmarcar todo
              </button>
              <button
                type="button"
                onClick={guardarPropuesta}
                disabled={guardandoPropuesta || aceptados.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {guardandoPropuesta ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Guardar propuesta ({aceptados.length})
              </button>
              <span className="text-[10px] text-text-muted">
                {MODELO_TEXTOS} · {propuesta.llamadas.map((x) => `${x.idioma} ${x.input_tokens}/${x.output_tokens}`).join(" · ")} tokens
              </span>
            </div>
            <PropuestaDeTextos descartados={descartados} propuesta={propuesta.propuesta} errores={propuesta.errores} aceptados={aceptados} onCambio={setAceptados} />
          </div>
        )}
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
