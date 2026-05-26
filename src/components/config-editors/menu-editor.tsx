"use client";

import { useState } from "react";
import { Plus, UtensilsCrossed, ChevronDown, ChevronRight } from "lucide-react";
import { ImageUploadField } from "../image-upload-field";
import { ReorderControls, moveItem } from "./reorder-controls";

/**
 * Editor for sections.menu (cafeteria).
 *
 * Two coupled lists like portfolio:
 *   - `categories[]`: { key, label } chips that filter the menu page.
 *   - `items[]`: each MenuItem belongs to one category via `item.category === category.key`.
 *
 * Removing a category re-assigns orphan items to the first remaining one so
 * the menu page never has invisible items.
 */

export type MenuCategory = { key: string; label: string };

export type MenuItem = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: string;
  image: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function MenuEditor({
  categories,
  items,
  onCategoriesChange,
  onItemsChange,
  clientId,
}: {
  categories: MenuCategory[] | undefined;
  items: MenuItem[] | undefined;
  onCategoriesChange: (next: MenuCategory[] | undefined) => void;
  onItemsChange: (next: MenuItem[] | undefined) => void;
  clientId: string;
}) {
  const categoryList = categories ?? [];
  const itemList = items ?? [];
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  /* ── Categories ──────────────────────────────────────────────── */
  function updateCategory(i: number, patch: Partial<MenuCategory>) {
    const next = categoryList.slice();
    next[i] = { ...next[i], ...patch };
    onCategoriesChange(next);
  }

  function removeCategory(i: number) {
    const removed = categoryList[i].key;
    const next = categoryList.filter((_, idx) => idx !== i);
    onCategoriesChange(next.length > 0 ? next : undefined);

    const fallback = next[0]?.key ?? "todos";
    if (itemList.some((it) => it.category === removed)) {
      onItemsChange(itemList.map((it) => (it.category === removed ? { ...it, category: fallback } : it)));
    }
  }

  function moveCategory(from: number, dir: -1 | 1) {
    onCategoriesChange(moveItem(categoryList, from, from + dir));
  }

  function addCategory() {
    onCategoriesChange([...categoryList, { key: `cat-${categoryList.length + 1}`, label: "" }]);
  }

  /* ── Items ──────────────────────────────────────────────────── */
  function updateMenuItem(i: number, patch: Partial<MenuItem>) {
    const next = itemList.slice();
    next[i] = { ...next[i], ...patch };
    // Auto-derive id from name if missing.
    if (patch.name && !next[i].id) {
      next[i].id = slugify(patch.name) || `item-${i + 1}`;
    }
    onItemsChange(next);
  }

  function removeMenuItem(i: number) {
    const out = itemList.filter((_, idx) => idx !== i);
    onItemsChange(out.length > 0 ? out : undefined);
  }

  function moveMenuItem(from: number, dir: -1 | 1) {
    onItemsChange(moveItem(itemList, from, from + dir));
  }

  function addMenuItem() {
    const defaultCat = categoryList[0]?.key ?? "todos";
    onItemsChange([
      ...itemList,
      {
        id: `item-${Date.now().toString(36)}`,
        name: "",
        subtitle: "",
        description: "",
        category: defaultCat,
        image: "",
      },
    ]);
    setExpanded((prev) => new Set([...prev, itemList.length]));
  }

  function toggleItem(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Categories */}
      <div className="rounded-lg border border-border bg-bg-elevated p-3">
        <p className="mb-1 text-[11px] font-semibold text-text-secondary">Categorias del menu</p>
        <p className="mb-2 text-[10px] text-text-muted">
          Cada item del menu pertenece a una categoria (cafes, postres, etc.). Si borras una
          categoria, los items se reasignan a la primera que quede.
        </p>
        {categoryList.length === 0 ? (
          <p className="rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[10px] text-amber-300">
            Sin categorias. Agrega al menos una antes de cargar items.
          </p>
        ) : (
          <div className="space-y-1.5">
            {categoryList.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={c.key}
                  onChange={(e) =>
                    updateCategory(i, { key: slugify(e.target.value) || `cat-${i + 1}` })
                  }
                  placeholder="cafes"
                  className="w-24 rounded border border-border bg-bg-card px-2 py-1 font-mono text-[10px] text-accent focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  value={c.label}
                  onChange={(e) => updateCategory(i, { label: e.target.value })}
                  placeholder="Cafes"
                  className="flex-1 rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                />
                <ReorderControls
                  index={i}
                  total={categoryList.length}
                  onMoveUp={() => moveCategory(i, -1)}
                  onMoveDown={() => moveCategory(i, 1)}
                  onRemove={() => removeCategory(i)}
                />
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addCategory}
          className="mt-2 inline-flex items-center gap-1 rounded border border-dashed border-border px-2 py-1 text-[10px] text-text-muted hover:border-accent hover:text-accent"
        >
          <Plus size={10} /> Agregar categoria
        </button>
      </div>

      {/* Items */}
      <div>
        <p className="mb-2 text-[11px] font-semibold text-text-secondary">Items del menu</p>
        {itemList.length === 0 ? (
          <div className="rounded-lg border border-border bg-bg-elevated px-3 py-6 text-center">
            <UtensilsCrossed size={20} className="mx-auto mb-2 text-text-muted" />
            <p className="text-[11px] text-text-secondary">Sin items cargados</p>
            <p className="mt-0.5 text-[10px] text-text-muted">
              Cada item se muestra como una card con foto, nombre, subtitulo y descripcion en la
              seccion Menu del cliente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {itemList.map((it, i) => {
              const isOpen = expanded.has(i);
              const missing: string[] = [];
              if (!it.name.trim()) missing.push("nombre");
              if (!it.category.trim()) missing.push("categoria");
              const validCategory = categoryList.some((c) => c.key === it.category);

              return (
                <div
                  key={i}
                  className={`rounded-lg border bg-bg-elevated ${
                    missing.length > 0 || !validCategory ? "border-amber-500/30" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleItem(i)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      {isOpen ? (
                        <ChevronDown size={12} className="text-text-muted" />
                      ) : (
                        <ChevronRight size={12} className="text-text-muted" />
                      )}
                      {it.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.image}
                          alt=""
                          className="h-7 w-7 rounded object-cover"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-bg-active text-[10px] text-text-muted">
                          •
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-text">
                          {it.name || <span className="text-amber-300/80">Sin nombre</span>}
                        </p>
                        <p className="truncate text-[10px] text-text-muted">
                          <code className="font-mono">{it.category}</code>
                          {it.subtitle && ` · ${it.subtitle}`}
                        </p>
                      </div>
                    </button>
                    <ReorderControls
                      index={i}
                      total={itemList.length}
                      onMoveUp={() => moveMenuItem(i, -1)}
                      onMoveDown={() => moveMenuItem(i, 1)}
                      onRemove={() => removeMenuItem(i)}
                    />
                  </div>

                  {isOpen && (
                    <div className="space-y-2 border-t border-border px-3 pb-3 pt-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Labeled label="Nombre">
                          <input
                            type="text"
                            value={it.name}
                            onChange={(e) => updateMenuItem(i, { name: e.target.value })}
                            placeholder="Espresso clasico"
                            className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                          />
                        </Labeled>
                        <Labeled label="Subtitulo">
                          <input
                            type="text"
                            value={it.subtitle}
                            onChange={(e) => updateMenuItem(i, { subtitle: e.target.value })}
                            placeholder="40 ml · cuerpo medio"
                            className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                          />
                        </Labeled>
                      </div>

                      <Labeled label="Descripcion">
                        <textarea
                          value={it.description}
                          onChange={(e) => updateMenuItem(i, { description: e.target.value })}
                          rows={2}
                          className="w-full resize-none rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                        />
                      </Labeled>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <Labeled label="ID (slug)">
                          <input
                            type="text"
                            value={it.id}
                            onChange={(e) => updateMenuItem(i, { id: e.target.value })}
                            className="w-full rounded border border-border bg-bg-card px-2 py-1 font-mono text-[10px] text-text focus:border-accent focus:outline-none"
                          />
                        </Labeled>
                        <Labeled label="Categoria">
                          <select
                            value={it.category}
                            onChange={(e) => updateMenuItem(i, { category: e.target.value })}
                            className={`w-full rounded border bg-bg-card px-2 py-1 text-xs focus:border-accent focus:outline-none ${
                              validCategory ? "border-border text-text" : "border-amber-500/40 text-amber-300"
                            }`}
                          >
                            {!validCategory && <option value={it.category}>{it.category} (huerfano)</option>}
                            {categoryList.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label || c.key}
                              </option>
                            ))}
                          </select>
                        </Labeled>
                      </div>

                      <ImageUploadField
                        label="Imagen"
                        value={it.image}
                        onChange={(url) => updateMenuItem(i, { image: url ?? "" })}
                        clientId={clientId}
                      />

                      {missing.length > 0 && (
                        <p className="text-[10px] text-amber-300/80">
                          Falta completar: {missing.join(", ")}.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={addMenuItem}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Plus size={12} /> Agregar item
        </button>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-text-muted">{label}</label>
      {children}
    </div>
  );
}
