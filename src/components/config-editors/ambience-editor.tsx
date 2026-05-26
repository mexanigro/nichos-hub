"use client";

import { Plus, Coffee } from "lucide-react";
import { ImageUploadField } from "../image-upload-field";
import { ReorderControls, moveItem } from "./reorder-controls";

/** Cafeteria's ambience section — one card per sector of the venue. */
export type AmbienceSector = {
  label: string;
  body: string;
  imageSrc: string;
};

export function AmbienceEditor({
  value,
  onChange,
  clientId,
}: {
  value: AmbienceSector[] | undefined;
  onChange: (next: AmbienceSector[] | undefined) => void;
  clientId: string;
}) {
  const items = value ?? [];

  function update(index: number, patch: Partial<AmbienceSector>) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function remove(index: number) {
    const out = items.filter((_, i) => i !== index);
    onChange(out.length > 0 ? out : undefined);
  }

  function move(from: number, dir: -1 | 1) {
    onChange(moveItem(items, from, from + dir));
  }

  function add() {
    onChange([...items, { label: "", body: "", imageSrc: "" }]);
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
      {items.map((s, i) => {
        const missing: string[] = [];
        if (!s.label.trim()) missing.push("nombre");
        if (!s.body.trim()) missing.push("descripcion");
        if (!s.imageSrc.trim()) missing.push("imagen");

        return (
          <div
            key={i}
            className={`rounded-lg border bg-bg-elevated p-3 ${
              missing.length > 0 ? "border-amber-500/30" : "border-border"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Sector {i + 1}
              </span>
              <ReorderControls
                index={i}
                total={items.length}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                onRemove={() => remove(i)}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">Nombre</label>
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="Barra"
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">Descripcion</label>
                <input
                  type="text"
                  value={s.body}
                  onChange={(e) => update(i, { body: e.target.value })}
                  placeholder="Donde se charla con los baristas"
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-2">
              <ImageUploadField
                label="Imagen del sector"
                value={s.imageSrc}
                onChange={(url) => update(i, { imageSrc: url ?? "" })}
                clientId={clientId}
              />
            </div>

            {missing.length > 0 && (
              <p className="mt-1 text-[10px] text-amber-300/80">Falta completar: {missing.join(", ")}.</p>
            )}
          </div>
        );
      })}
      <AddButton onClick={add} />
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
      <Plus size={12} /> Agregar sector
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated px-3 py-6 text-center">
      <Coffee size={20} className="mx-auto mb-2 text-text-muted" />
      <p className="text-[11px] text-text-secondary">Sin sectores cargados</p>
      <p className="mt-0.5 text-[10px] text-text-muted">
        Cada sector aparece como una card con foto + descripcion en la seccion Ambiente del
        cliente. Ideal para mostrar la barra, las mesas, la terraza, etc.
      </p>
    </div>
  );
}
