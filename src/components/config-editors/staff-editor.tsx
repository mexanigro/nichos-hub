"use client";

import { useState } from "react";
import { Plus, Users, ChevronDown, ChevronRight } from "lucide-react";
import { ImageUploadField, ImageUploadListField } from "../image-upload-field";
import { ReorderControls, moveItem } from "./reorder-controls";
import {
  ScheduleEditor,
  defaultWeeklySchedule,
  scheduleFromBusinessHours,
  type WeeklySchedule,
  type BusinessHours,
} from "./schedule-editor";
import { SelectorIdioma } from "../selector-idioma";
import { useClientLanguage } from "@/lib/client-language-context";
import { aplicarTextoIdioma, leerTextoIdioma, quitarTextoIdioma } from "@/lib/textos-idioma";
import { validateFraseEquipo } from "@/lib/config-validator";
import type { ClientLanguage } from "@/lib/client-language";

export type StaffSocial = {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  whatsapp?: string;
};

/**
 * What we let owners edit. The template's full `StaffMember` type also has
 * `slug`, `schedule: WeeklySchedule`, `blockedDates`, etc. — those are
 * managed by the staff admin inside the template itself, not from the hub.
 *
 * Backward compat: pre-Bloque 3, the hub wrote `{ photoUrl, portfolio }`
 * keyed by index of the preset. New entries here add full member data;
 * existing entries keep their photoUrl/portfolio and gain optional fields.
 */
export type StaffMember = {
  id?: string;
  name?: string;
  photoUrl?: string;
  specialty?: string;
  bio?: string;
  portfolio?: string[];
  social?: StaffSocial;
  schedule?: WeeklySchedule;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** ARREGLOS-03 (D-154): borra la persona `i` de la raíz y su texto de cada idioma, en un solo config (un solo `setConfig`).
 *  TEAM-RESENAS-01 (D-176): la única no se borra —una lista vacía no viaja por JSON y Firestore conservaría la vieja—; para no
 *  mostrar el equipo se oculta la sección (`features.showTeam`). */
export function quitarMiembro(config: Record<string, unknown>, i: number): Record<string, unknown> {
  const lista = Array.isArray(config.staff) ? (config.staff as StaffMember[]) : [];
  if (lista.length <= 1 || !lista[i]) return config;
  const id = lista[i].id;
  const sinRaiz = { ...config, staff: lista.filter((_, j) => j !== i) };
  return id ? quitarTextoIdioma(sinRaiz, { seccion: "staff", id }) : sinRaiz;
}

/** Lo que la casilla llama al borrar una persona: una función pura dentro de un único `setConfig`. Exportado para que
 *  `tests/casillas-sin-huecos.test.ts` ejecute el mismo camino que la casilla (condición 1 del revisor). */
export function accionesEquipo(setConfig: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void) {
  return { quitar: (index: number) => setConfig((prev) => quitarMiembro(prev, index)) };
}

export function StaffEditor({
  value,
  onChange,
  clientId,
  businessHours,
  config,
  setConfig,
}: {
  value: StaffMember[] | undefined;
  onChange: (next: StaffMember[] | undefined) => void;
  clientId: string;
  /** Business-wide hours from `config.hours`. Passed down so each member's
   *  schedule editor can offer "Mismo horario que el negocio". */
  businessHours?: BusinessHours;
  /** IDIOMAS-01: con el config entero, la casilla edita también el texto de los otros idiomas. */
  config?: Record<string, unknown>;
  setConfig?: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
}) {
  const items = value ?? [];
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const base = useClientLanguage();
  const [idioma, setIdioma] = useState<ClientLanguage>(base);
  const otro = idioma !== base && !!config && !!setConfig;
  /** El texto de `campo` en el idioma que se edita: el de la raíz en el base; el de la capa (o vacío = pendiente) en otro. */
  const texto = (m: StaffMember, campo: "name" | "specialty" | "bio") =>
    otro ? leerTextoIdioma(config, { seccion: "staff", id: m.id ?? "", campo, idioma, base }) : (m[campo] ?? "");
  function escribir(i: number, campo: "name" | "specialty" | "bio", valor: string) {
    const id = items[i].id;
    if (!otro) return update(i, { [campo]: valor });
    if (id) setConfig!((prev) => aplicarTextoIdioma(prev, { seccion: "staff", id, campo, valor, idioma, base }));
  }

  function toggle(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function update(index: number, patch: Partial<StaffMember>) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    // Auto-derive id from name if missing.
    if (patch.name && !next[index].id) {
      next[index].id = slugify(patch.name) || `miembro-${index + 1}`;
    }
    onChange(next);
  }

  function updateSocial(index: number, key: keyof StaffSocial, val: string) {
    const current = items[index].social ?? {};
    const social = { ...current, [key]: val || undefined };
    update(index, { social });
  }

  function remove(index: number) {
    // TEAM-RESENAS-01 (D-176): la única no se borra (ver quitarMiembro).
    if (items.length <= 1) return;
    // ARREGLOS-03: con el config entero, la raíz y el texto de cada idioma se van en el mismo setConfig.
    if (setConfig) accionesEquipo(setConfig).quitar(index);
    else onChange(items.filter((_, i) => i !== index));
    setExpanded((prev) => {
      const set = new Set<number>();
      for (const e of prev) {
        if (e < index) set.add(e);
        else if (e > index) set.add(e - 1);
      }
      return set;
    });
  }

  function move(from: number, dir: -1 | 1) {
    const to = from + dir;
    onChange(moveItem(items, from, to));
    setExpanded((prev) => {
      const set = new Set<number>();
      for (const e of prev) {
        if (e === from) set.add(to);
        else if (e === to) set.add(from);
        else set.add(e);
      }
      return set;
    });
  }

  function add() {
    // Seed a schedule so the booking engine has something to work with
    // until the owner customizes it. Without this, newly added staff members
    // have `undefined` schedule and break availability calc in the template.
    // Priority: clone first existing member -> business hours -> hardcoded default.
    const seed: WeeklySchedule = items[0]?.schedule
      ? JSON.parse(JSON.stringify(items[0].schedule))
      : businessHours && Object.keys(businessHours).length > 0
        ? scheduleFromBusinessHours(businessHours)
        : defaultWeeklySchedule();
    const next: StaffMember[] = [
      ...items,
      {
        name: "",
        id: `miembro-${items.length + 1}`,
        schedule: seed,
      },
    ];
    onChange(next);
    setExpanded((prev) => new Set([...prev, items.length]));
  }

  // TEAM-RESENAS-01 (D-183, CT-2): con team v6, la primera oración de cada bio, en cada idioma, va hasta 10 palabras.
  const avisosFrase = config ? validateFraseEquipo(config) : [];

  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <EmptyState />
        <AddButton onClick={add} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {config && setConfig && (
        <SelectorIdioma idioma={idioma} base={base} onCambio={setIdioma} conCapa={(code) => !!(config.translations as Record<string, Record<string, unknown>> | undefined)?.[code]?.staff} />
      )}
      {otro && (
        <p className="text-[10px] text-text-muted">
          Texto en otro idioma: lo vacío queda pendiente y la web muestra el del idioma base. Foto, id y horario son los mismos en los cuatro idiomas.
        </p>
      )}
      {items.length === 1 && (
        <p className="text-[10px] text-text-muted">
          La única persona no se puede borrar. Para no mostrar el equipo, ocultá la sección con <code>features.showTeam</code> en Config.
        </p>
      )}
      {avisosFrase.length > 0 && (
        <ul className="space-y-0.5 rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1.5 text-[10px] text-amber-300">
          {avisosFrase.map((a) => (
            <li key={a.path}><code>{a.path}</code>: {a.message}</li>
          ))}
        </ul>
      )}
      {items.map((m, i) => {
        const isOpen = expanded.has(i);
        const hasName = !!(m.name && m.name.trim());
        return (
          <div
            key={i}
            className={`rounded-lg border bg-bg-elevated ${hasName ? "border-border" : "border-amber-500/30"}`}
          >
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                {isOpen ? (
                  <ChevronDown size={12} className="text-text-muted" />
                ) : (
                  <ChevronRight size={12} className="text-text-muted" />
                )}
                {m.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.photoUrl}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-active text-[10px] font-semibold text-text-muted">
                    {(m.name || "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text">
                    {m.name || <span className="text-amber-300/80">Sin nombre</span>}
                  </p>
                  {m.specialty && (
                    <p className="truncate text-[10px] text-text-muted">{m.specialty}</p>
                  )}
                </div>
              </button>
              <ReorderControls
                index={i}
                total={items.length}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                onRemove={() => remove(i)}
              />
            </div>

            {isOpen && (
              <div className="space-y-3 border-t border-border px-3 pb-3 pt-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <LabeledInput
                    label="Nombre"
                    value={texto(m, "name")}
                    onChange={(v) => escribir(i, "name", v)}
                    placeholder={otro ? m.name ?? "" : "Maria Lopez"}
                    required={!otro}
                  />
                  <LabeledInput
                    label="Rol / Especialidad"
                    value={texto(m, "specialty")}
                    onChange={(v) => escribir(i, "specialty", v)}
                    placeholder={otro ? m.specialty ?? "" : "Esteticista senior"}
                  />
                </div>

                <div>
                  <label className="mb-0.5 block text-[10px] text-text-muted">Bio</label>
                  <textarea
                    value={texto(m, "bio")}
                    onChange={(e) => escribir(i, "bio", e.target.value)}
                    rows={2}
                    placeholder={otro ? m.bio ?? "" : "10 anos de experiencia en tratamientos faciales..."}
                    className="w-full resize-none rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                  />
                </div>

                <ImageUploadField
                  label="Foto de perfil"
                  value={m.photoUrl ?? ""}
                  onChange={(url) => update(i, { photoUrl: url || undefined })}
                  clientId={clientId}
                />

                <div>
                  <p className="mb-1 text-[11px] font-medium text-text-secondary">
                    Portfolio (imagenes)
                  </p>
                  <ImageUploadListField
                    value={m.portfolio ?? []}
                    onChange={(imgs) =>
                      update(i, { portfolio: imgs.length > 0 ? imgs : undefined })
                    }
                    clientId={clientId}
                  />
                </div>

                <div>
                  <p className="mb-1 text-[11px] font-medium text-text-secondary">Redes sociales</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <LabeledInput
                      label="Instagram"
                      value={m.social?.instagram ?? ""}
                      onChange={(v) => updateSocial(i, "instagram", v)}
                      placeholder="https://instagram.com/..."
                    />
                    <LabeledInput
                      label="WhatsApp"
                      value={m.social?.whatsapp ?? ""}
                      onChange={(v) => updateSocial(i, "whatsapp", v)}
                      placeholder="https://wa.me/972..."
                    />
                    <LabeledInput
                      label="Facebook"
                      value={m.social?.facebook ?? ""}
                      onChange={(v) => updateSocial(i, "facebook", v)}
                      placeholder="https://facebook.com/..."
                    />
                    <LabeledInput
                      label="Twitter / X"
                      value={m.social?.twitter ?? ""}
                      onChange={(v) => updateSocial(i, "twitter", v)}
                      placeholder="https://x.com/..."
                    />
                  </div>
                </div>

                <ScheduleEditor
                  value={m.schedule}
                  onChange={(schedule) => update(i, { schedule })}
                  businessHours={businessHours}
                />

                <p className="text-[10px] text-text-muted">
                  ID:{" "}
                  <code className="rounded bg-bg-card px-1 py-0.5 text-[10px] text-text-secondary">
                    {m.id || "—"}
                  </code>
                  {!m.schedule && (
                    <span className="ml-2 text-amber-300/80">
                      · Sin horario — el booking engine va a usar el default.
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        );
      })}
      <AddButton onClick={add} />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-text-muted">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <Plus size={12} /> Agregar miembro
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated px-3 py-6 text-center">
      <Users size={20} className="mx-auto mb-2 text-text-muted" />
      <p className="text-[11px] text-text-secondary">Sin miembros cargados</p>
      <p className="mt-0.5 text-[10px] text-text-muted">
        Cada miembro aparece como una card en la seccion Equipo del cliente. Mientras no cargues
        ninguno, la web muestra los de ejemplo del nicho. Para no mostrar el equipo, ocultá la seccion
        con <code>features.showTeam</code> en Config. Solo se ve en modo Equipo.
      </p>
    </div>
  );
}
