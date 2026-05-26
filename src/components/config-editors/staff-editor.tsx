"use client";

import { useState } from "react";
import { Plus, Users, ChevronDown, ChevronRight } from "lucide-react";
import { ImageUploadField, ImageUploadListField } from "../image-upload-field";
import { ReorderControls, moveItem } from "./reorder-controls";

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

export function StaffEditor({
  value,
  onChange,
  clientId,
}: {
  value: StaffMember[] | undefined;
  onChange: (next: StaffMember[] | undefined) => void;
  clientId: string;
}) {
  const items = value ?? [];
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

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
    const next = items.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : undefined);
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
    const next = [...items, { name: "", id: `miembro-${items.length + 1}` }];
    onChange(next);
    setExpanded((prev) => new Set([...prev, items.length]));
  }

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
                    value={m.name ?? ""}
                    onChange={(v) => update(i, { name: v })}
                    placeholder="Maria Lopez"
                    required
                  />
                  <LabeledInput
                    label="Rol / Especialidad"
                    value={m.specialty ?? ""}
                    onChange={(v) => update(i, { specialty: v })}
                    placeholder="Esteticista senior"
                  />
                </div>

                <div>
                  <label className="mb-0.5 block text-[10px] text-text-muted">Bio</label>
                  <textarea
                    value={m.bio ?? ""}
                    onChange={(e) => update(i, { bio: e.target.value })}
                    rows={2}
                    placeholder="10 anos de experiencia en tratamientos faciales..."
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

                <p className="text-[10px] text-text-muted">
                  ID:{" "}
                  <code className="rounded bg-bg-card px-1 py-0.5 text-[10px] text-text-secondary">
                    {m.id || "—"}
                  </code>{" "}
                  · El horario semanal del miembro se administra desde el panel admin del cliente.
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
        Cada miembro aparece como una card en la seccion Equipo del cliente. Si dejas la lista
        vacia se usan los del preset del nicho. Solo se ve en modo Equipo.
      </p>
    </div>
  );
}
