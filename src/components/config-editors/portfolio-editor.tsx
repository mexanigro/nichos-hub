"use client";

import { useState } from "react";
import { Plus, Hammer, ChevronDown, ChevronRight } from "lucide-react";
import { ImageUploadListField } from "../image-upload-field";
import { ReorderControls, moveItem } from "./reorder-controls";

/**
 * Editor for sections.portfolio (remodelaciones).
 *
 * The template's portfolio has two coupled lists:
 *   - `filters[]`: { key, label } chips at the top of the page.
 *   - `projects[]`: each project belongs to ONE filter via project.filter === filter.key.
 *
 * Each project optionally has before/after `gallery` pairs (for renovation
 * before-after sliders).
 */

export type PortfolioFilter = {
  key: string;
  label: string;
};

export type PortfolioGalleryPair = {
  before: string;
  after: string;
  caption?: string;
};

export type PortfolioProject = {
  title: string;
  type: string;
  description: string;
  duration?: string;
  size?: string;
  filter: string;
  images: string[];
  gallery?: PortfolioGalleryPair[];
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

export function PortfolioEditor({
  filters,
  projects,
  onFiltersChange,
  onProjectsChange,
  clientId,
}: {
  filters: PortfolioFilter[] | undefined;
  projects: PortfolioProject[] | undefined;
  onFiltersChange: (next: PortfolioFilter[] | undefined) => void;
  onProjectsChange: (next: PortfolioProject[] | undefined) => void;
  clientId: string;
}) {
  const filterList = filters ?? [];
  const projectList = projects ?? [];
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  /* ── Filters ─────────────────────────────────────────────────── */
  function updateFilter(i: number, patch: Partial<PortfolioFilter>) {
    const next = filterList.slice();
    next[i] = { ...next[i], ...patch };
    onFiltersChange(next);
  }

  function removeFilter(i: number) {
    const removed = filterList[i].key;
    const nextFilters = filterList.filter((_, idx) => idx !== i);
    onFiltersChange(nextFilters.length > 0 ? nextFilters : undefined);

    // Re-assign projects that used this filter to the first remaining one (or "todos").
    const fallback = nextFilters[0]?.key ?? "todos";
    if (projectList.some((p) => p.filter === removed)) {
      const reassigned = projectList.map((p) =>
        p.filter === removed ? { ...p, filter: fallback } : p,
      );
      onProjectsChange(reassigned);
    }
  }

  function moveFilter(from: number, dir: -1 | 1) {
    onFiltersChange(moveItem(filterList, from, from + dir));
  }

  function addFilter() {
    onFiltersChange([...filterList, { key: `filtro-${filterList.length + 1}`, label: "" }]);
  }

  /* ── Projects ────────────────────────────────────────────────── */
  function updateProject(i: number, patch: Partial<PortfolioProject>) {
    const next = projectList.slice();
    next[i] = { ...next[i], ...patch };
    onProjectsChange(next);
  }

  function removeProject(i: number) {
    const out = projectList.filter((_, idx) => idx !== i);
    onProjectsChange(out.length > 0 ? out : undefined);
    setExpanded((prev) => {
      const s = new Set<number>();
      for (const e of prev) {
        if (e < i) s.add(e);
        else if (e > i) s.add(e - 1);
      }
      return s;
    });
  }

  function moveProject(from: number, dir: -1 | 1) {
    onProjectsChange(moveItem(projectList, from, from + dir));
  }

  function addProject() {
    const defaultFilter = filterList[0]?.key ?? "todos";
    onProjectsChange([
      ...projectList,
      {
        title: "",
        type: "",
        description: "",
        filter: defaultFilter,
        images: [],
      },
    ]);
    setExpanded((prev) => new Set([...prev, projectList.length]));
  }

  function toggleProject(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  /* ── Gallery pairs (before/after) ────────────────────────────── */
  function addGalleryPair(projectIndex: number) {
    const project = projectList[projectIndex];
    const gallery = [...(project.gallery ?? []), { before: "", after: "", caption: "" }];
    updateProject(projectIndex, { gallery });
  }
  function updateGalleryPair(projectIndex: number, pairIndex: number, patch: Partial<PortfolioGalleryPair>) {
    const project = projectList[projectIndex];
    const gallery = [...(project.gallery ?? [])];
    gallery[pairIndex] = { ...gallery[pairIndex], ...patch };
    updateProject(projectIndex, { gallery });
  }
  function removeGalleryPair(projectIndex: number, pairIndex: number) {
    const project = projectList[projectIndex];
    const gallery = (project.gallery ?? []).filter((_, idx) => idx !== pairIndex);
    updateProject(projectIndex, { gallery: gallery.length > 0 ? gallery : undefined });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-lg border border-border bg-bg-elevated p-3">
        <p className="mb-1 text-[11px] font-semibold text-text-secondary">Filtros del portfolio</p>
        <p className="mb-2 text-[10px] text-text-muted">
          Cada proyecto debe pertenecer a uno de estos filtros. Si borras un filtro, los proyectos
          asociados se reasignan al primero que quede.
        </p>
        {filterList.length === 0 ? (
          <p className="rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[10px] text-amber-300">
            Sin filtros. Agrega al menos uno antes de cargar proyectos.
          </p>
        ) : (
          <div className="space-y-1.5">
            {filterList.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={f.key}
                  onChange={(e) =>
                    updateFilter(i, {
                      key: slugify(e.target.value) || `filtro-${i + 1}`,
                    })
                  }
                  placeholder="cocinas"
                  className="w-24 rounded border border-border bg-bg-card px-2 py-1 font-mono text-[10px] text-accent focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  value={f.label}
                  onChange={(e) => updateFilter(i, { label: e.target.value })}
                  placeholder="Cocinas"
                  className="flex-1 rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                />
                <ReorderControls
                  index={i}
                  total={filterList.length}
                  onMoveUp={() => moveFilter(i, -1)}
                  onMoveDown={() => moveFilter(i, 1)}
                  onRemove={() => removeFilter(i)}
                />
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addFilter}
          className="mt-2 inline-flex items-center gap-1 rounded border border-dashed border-border px-2 py-1 text-[10px] text-text-muted hover:border-accent hover:text-accent"
        >
          <Plus size={10} /> Agregar filtro
        </button>
      </div>

      {/* Projects */}
      <div>
        <p className="mb-2 text-[11px] font-semibold text-text-secondary">Proyectos</p>
        {projectList.length === 0 ? (
          <div className="rounded-lg border border-border bg-bg-elevated px-3 py-6 text-center">
            <Hammer size={20} className="mx-auto mb-2 text-text-muted" />
            <p className="text-[11px] text-text-secondary">Sin proyectos cargados</p>
            <p className="mt-0.5 text-[10px] text-text-muted">
              Cada proyecto se muestra como una card con imagenes, descripcion y duracion. Si
              tiene pares before/after, aparece un slider antes-despues.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectList.map((p, i) => {
              const isOpen = expanded.has(i);
              const missing: string[] = [];
              if (!p.title.trim()) missing.push("titulo");
              if (!p.filter.trim()) missing.push("filtro");
              if (p.images.length === 0 && (p.gallery ?? []).length === 0) missing.push("imagenes");
              const validFilter = filterList.some((f) => f.key === p.filter);

              return (
                <div
                  key={i}
                  className={`rounded-lg border bg-bg-elevated ${
                    missing.length > 0 || !validFilter ? "border-amber-500/30" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleProject(i)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      {isOpen ? (
                        <ChevronDown size={12} className="text-text-muted" />
                      ) : (
                        <ChevronRight size={12} className="text-text-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-text">
                          {p.title || <span className="text-amber-300/80">Sin titulo</span>}
                        </p>
                        <p className="truncate text-[10px] text-text-muted">
                          <code className="font-mono">{p.filter}</code>
                          {p.images.length > 0 && ` · ${p.images.length} img`}
                          {(p.gallery ?? []).length > 0 && ` · ${p.gallery!.length} antes/despues`}
                        </p>
                      </div>
                    </button>
                    <ReorderControls
                      index={i}
                      total={projectList.length}
                      onMoveUp={() => moveProject(i, -1)}
                      onMoveDown={() => moveProject(i, 1)}
                      onRemove={() => removeProject(i)}
                    />
                  </div>

                  {isOpen && (
                    <div className="space-y-3 border-t border-border px-3 pb-3 pt-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Labeled label="Titulo">
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) => updateProject(i, { title: e.target.value })}
                            placeholder="Remodelacion cocina Tel Aviv"
                            className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                          />
                        </Labeled>
                        <Labeled label="Tipo / Subtitulo">
                          <input
                            type="text"
                            value={p.type}
                            onChange={(e) => updateProject(i, { type: e.target.value })}
                            placeholder="Cocina abierta · Espacio"
                            className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                          />
                        </Labeled>
                      </div>

                      <Labeled label="Descripcion">
                        <textarea
                          value={p.description}
                          onChange={(e) => updateProject(i, { description: e.target.value })}
                          rows={2}
                          className="w-full resize-none rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                        />
                      </Labeled>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <Labeled label="Filtro">
                          <select
                            value={p.filter}
                            onChange={(e) => updateProject(i, { filter: e.target.value })}
                            className={`w-full rounded border bg-bg-card px-2 py-1 text-xs focus:border-accent focus:outline-none ${
                              validFilter ? "border-border text-text" : "border-amber-500/40 text-amber-300"
                            }`}
                          >
                            {!validFilter && <option value={p.filter}>{p.filter} (huerfano)</option>}
                            {filterList.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label || f.key}
                              </option>
                            ))}
                          </select>
                        </Labeled>
                        <Labeled label="Duracion (opcional)">
                          <input
                            type="text"
                            value={p.duration ?? ""}
                            onChange={(e) => updateProject(i, { duration: e.target.value || undefined })}
                            placeholder="4 semanas"
                            className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                          />
                        </Labeled>
                        <Labeled label="Tamano (opcional)">
                          <input
                            type="text"
                            value={p.size ?? ""}
                            onChange={(e) => updateProject(i, { size: e.target.value || undefined })}
                            placeholder="120 m2"
                            className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                          />
                        </Labeled>
                      </div>

                      <div>
                        <p className="mb-1 text-[11px] font-medium text-text-secondary">Imagenes</p>
                        <ImageUploadListField
                          value={p.images}
                          onChange={(imgs) => updateProject(i, { images: imgs })}
                          clientId={clientId}
                        />
                      </div>

                      <div className="rounded-lg border border-border bg-bg-card p-2.5">
                        <p className="mb-1 text-[11px] font-medium text-text-secondary">
                          Pares antes / despues (opcional)
                        </p>
                        <p className="mb-2 text-[10px] text-text-muted">
                          Si el proyecto tiene tomas comparativas, el template las renderiza como
                          slider before/after.
                        </p>
                        {(p.gallery ?? []).length === 0 ? (
                          <p className="text-[10px] text-text-muted">Sin pares cargados.</p>
                        ) : (
                          <div className="space-y-2">
                            {(p.gallery ?? []).map((pair, pi) => (
                              <div
                                key={pi}
                                className="rounded border border-border bg-bg-elevated p-2"
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-[10px] uppercase tracking-wider text-text-muted">
                                    Par {pi + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeGalleryPair(i, pi)}
                                    className="rounded p-0.5 text-text-muted hover:bg-red-500/10 hover:text-red-400"
                                    aria-label="Eliminar par"
                                  >
                                    <span className="text-[11px]">×</span>
                                  </button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <Labeled label="Antes (URL)">
                                    <input
                                      type="text"
                                      value={pair.before}
                                      onChange={(e) => updateGalleryPair(i, pi, { before: e.target.value })}
                                      placeholder="https://..."
                                      className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                                    />
                                  </Labeled>
                                  <Labeled label="Despues (URL)">
                                    <input
                                      type="text"
                                      value={pair.after}
                                      onChange={(e) => updateGalleryPair(i, pi, { after: e.target.value })}
                                      placeholder="https://..."
                                      className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                                    />
                                  </Labeled>
                                </div>
                                <div className="mt-2">
                                  <Labeled label="Caption (opcional)">
                                    <input
                                      type="text"
                                      value={pair.caption ?? ""}
                                      onChange={(e) =>
                                        updateGalleryPair(i, pi, { caption: e.target.value || undefined })
                                      }
                                      className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                                    />
                                  </Labeled>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => addGalleryPair(i)}
                          className="mt-2 inline-flex items-center gap-1 rounded border border-dashed border-border px-2 py-1 text-[10px] text-text-muted hover:border-accent hover:text-accent"
                        >
                          <Plus size={10} /> Agregar par
                        </button>
                      </div>

                      {missing.length > 0 && (
                        <p className="text-[10px] text-amber-300/80">
                          Falta completar: {missing.join(", ")}.
                        </p>
                      )}
                      {!validFilter && (
                        <p className="text-[10px] text-amber-300/80">
                          El filtro <code>{p.filter}</code> no existe en la lista actual de filtros.
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
          onClick={addProject}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Plus size={12} /> Agregar proyecto
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
