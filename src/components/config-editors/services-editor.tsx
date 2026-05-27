"use client";

import { useState } from "react";
import { Plus, Eye, EyeOff, AlertTriangle, RotateCcw, Wrench } from "lucide-react";
import { ImageUploadField } from "../image-upload-field";
import { ReorderControls, moveItem } from "./reorder-controls";
import { LanguageMismatchWarning } from "../language-mismatch-warning";
import { useClientLanguage } from "@/lib/client-language-context";
import type { BusinessNiche } from "@/lib/client-config/services";
import {
  getNicheServices,
  resolveVisibleServiceIds,
  toggleVisibleService,
  LANDING_SERVICES_DEFAULTS,
} from "@/lib/client-config/services";

/**
 * Full Service shape persisted in `config.services` when the client opts into
 * custom mode. Matches master-template's `Service` type.
 */
export type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  image?: string;
  fromPrice?: string;
  category?: string;
  subtitle?: string;
  features?: string[];
  popular?: boolean;
};

type ConfigSlice = {
  services?: Service[];
  visibleServices?: string[] | null;
  serviceOverrides?: Record<string, Record<string, unknown>> | null;
  landingServicesCount?: number | null;
  features?: Record<string, boolean>;
  business?: { type?: string };
  /**
   * Internal backup of the custom services list, written when the owner
   * clicks "Volver al preset". Survives until the next Save so the owner
   * can recover their work if they meant to keep it. Cleared the next
   * time the owner re-enters custom mode (since they're starting fresh).
   */
  _customServicesBackup?: Service[] | null;
};

type SetConfig = (updater: (prev: ConfigSlice) => ConfigSlice) => void;

/**
 * Dual-mode services editor.
 *
 * **Preset mode** (default):
 *   - The template's preset list is the source of truth.
 *   - Owner can hide services via `visibleServices` (allow-list).
 *   - Owner can patch name/price/duration/desc/image per service via
 *     `serviceOverrides`.
 *   - Adding a brand new service is NOT possible here.
 *
 * **Custom mode**:
 *   - Activated when `config.services` is a non-empty array.
 *   - Replaces the preset's service list entirely on the deployed site.
 *   - Owner can Add / Remove / Edit / Reorder freely.
 *   - Trade-off: future preset updates from master-template don't reach
 *     this client until they switch back. A banner makes this explicit.
 *
 * Switching: owner clicks "Agregar servicio custom" → we materialize the
 * effective preset list (filtered by visibleServices + patched with
 * serviceOverrides) into `config.services`, append an empty new service,
 * and clear `visibleServices`/`serviceOverrides` since they no longer apply.
 * "Volver al preset" wipes `config.services` and restores defaults.
 */
export function ServicesEditor({
  niche,
  config,
  setConfig,
  clientId,
}: {
  niche: BusinessNiche;
  config: ConfigSlice;
  setConfig: SetConfig;
  clientId: string;
}) {
  const customMode = Array.isArray(config.services) && config.services.length > 0;
  const presetServices = getNicheServices(niche);

  if (customMode) {
    return (
      <CustomServicesEditor
        services={config.services!}
        onChange={(next) =>
          setConfig((prev) => ({ ...prev, services: next.length > 0 ? (next as never) : undefined }))
        }
        onReturnToPreset={() => {
          // Stash the current custom list as a backup so "volver al preset" is recoverable.
          setConfig((prev) => ({
            ...prev,
            _customServicesBackup: prev.services && prev.services.length > 0 ? prev.services : null,
            services: undefined,
            visibleServices: null,
            serviceOverrides: null,
          }));
        }}
        clientId={clientId}
      />
    );
  }

  // Preset mode
  const customBackup = config._customServicesBackup;
  const hasCustomBackup = Array.isArray(customBackup) && customBackup.length > 0;
  return (
    <PresetServicesEditor
      niche={niche}
      config={config}
      setConfig={setConfig}
      presetServices={presetServices}
      backup={hasCustomBackup ? customBackup : null}
      onRestoreBackup={() => {
        if (!hasCustomBackup) return;
        setConfig((prev) => ({
          ...prev,
          services: prev._customServicesBackup ?? undefined,
          _customServicesBackup: null,
          visibleServices: null,
          serviceOverrides: null,
        }));
      }}
      onDiscardBackup={() => {
        setConfig((prev) => ({ ...prev, _customServicesBackup: null }));
      }}
      onSwitchToCustom={() => {
        // Entering custom fresh — clear any stale backup since we're starting over.
        // Materialize: preset filtered by visibleServices, patched with overrides
        const visibleIds = resolveVisibleServiceIds(
          config,
          presetServices,
        );
        const visibleSet = new Set(visibleIds);
        const overrides = config.serviceOverrides ?? {};
        const materialized: Service[] = presetServices
          .filter((s) => visibleSet.has(s.id))
          .map((s) => {
            const patch = overrides[s.id] ?? {};
            return {
              id: s.id,
              name: (patch.name as string) || s.label,
              description: (patch.description as string) || "",
              duration: Number(patch.duration) || 30,
              price: Number(patch.price) || 0,
              image: (patch.image as string) || undefined,
            };
          });
        // Append empty new slot
        materialized.push({
          id: `custom-${Date.now().toString(36)}`,
          name: "",
          description: "",
          duration: 30,
          price: 0,
        });
        setConfig((prev) => ({
          ...prev,
          services: materialized,
          visibleServices: null,
          serviceOverrides: null,
          _customServicesBackup: null,
        }));
      }}
    />
  );
}

/* ─── Preset mode ───────────────────────────────────────────────────── */

function PresetServicesEditor({
  niche,
  config,
  setConfig,
  presetServices,
  onSwitchToCustom,
  backup,
  onRestoreBackup,
  onDiscardBackup,
}: {
  niche: BusinessNiche;
  config: ConfigSlice;
  setConfig: SetConfig;
  presetServices: { id: string; label: string }[];
  onSwitchToCustom: () => void;
  backup: Service[] | null;
  onRestoreBackup: () => void;
  onDiscardBackup: () => void;
}) {
  const visibleIds = resolveVisibleServiceIds(config, presetServices);
  const visibleSet = new Set(visibleIds);
  const overrides = config.serviceOverrides ?? {};

  function toggleService(id: string) {
    setConfig((prev) => {
      const next = toggleVisibleService(prev, presetServices, id);
      return {
        ...prev,
        features: next.features,
        visibleServices: next.visibleServices,
      };
    });
  }

  function updateOverrideField(serviceId: string, field: string, value: string) {
    setConfig((prev) => {
      const current = prev.serviceOverrides ?? {};
      const patch = { ...(current[serviceId] ?? {}), [field]: value || null };
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(patch)) {
        if (v !== null && v !== undefined) cleaned[k] = v;
      }
      const next = { ...current, [serviceId]: cleaned };
      if (Object.keys(cleaned).length === 0) delete next[serviceId];
      return {
        ...prev,
        serviceOverrides: Object.keys(next).length > 0 ? next : null,
      };
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-bg-elevated p-3 text-[11px] text-text-secondary">
        <p>
          Modo <strong className="text-text">preset</strong>: la lista oficial de servicios del
          nicho es la fuente de verdad. Activa/oculta items y personaliza nombre, precio,
          duracion, descripcion o imagen.
        </p>
      </div>

      {backup && (
        <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3 text-[11px]">
          <RotateCcw size={14} className="mt-0.5 shrink-0 text-accent" />
          <div className="flex-1">
            <p className="font-medium text-text">
              Hay un backup de tus servicios custom ({backup.length} item{backup.length === 1 ? "" : "s"})
            </p>
            <p className="text-text-secondary">
              Volviste al preset hace poco. Si fue sin querer, podes restaurar la lista custom.
              El backup se borra cuando guardes el config o cuando vuelvas a entrar a modo custom desde cero.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onDiscardBackup}
              className="rounded border border-border bg-bg-card px-2 py-1 text-[10px] text-text-muted hover:text-text"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={onRestoreBackup}
              className="rounded border border-accent/30 bg-accent/15 px-2 py-1 text-[10px] font-medium text-accent hover:bg-accent/25"
            >
              Restaurar custom
            </button>
          </div>
        </div>
      )}

      {/* Visibility */}
      <div className="rounded-xl border border-border bg-bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-text-secondary">
          <Eye size={11} /> Visibilidad
        </div>
        <div className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[11px] text-text-secondary">
          <span className="font-semibold text-text">{visibleIds.length}</span> de{" "}
          <span className="font-semibold text-text">{presetServices.length}</span> visibles
          {visibleIds.length === 0 && (
            <span className="ml-2 text-amber-300">La seccion Servicios queda apagada.</span>
          )}
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {presetServices.map((s) => {
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
                {isOn ? <Eye size={11} /> : <EyeOff size={11} />}
                <span className="flex-1 text-left">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Landing count */}
        {visibleIds.length > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-bg-elevated p-3">
            <div>
              <p className="text-[11px] font-semibold text-text-secondary">
                Servicios en la landing
              </p>
              <p className="text-[10px] text-text-muted">
                Cuantos se muestran en la pagina principal (la pagina /servicios muestra todos).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={visibleIds.length}
                value={config.landingServicesCount ?? LANDING_SERVICES_DEFAULTS[niche]}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  const defaultVal = LANDING_SERVICES_DEFAULTS[niche];
                  setConfig((prev) => ({
                    ...prev,
                    landingServicesCount: val === defaultVal ? null : val,
                  }));
                }}
                className="h-1.5 w-24 cursor-pointer accent-accent"
              />
              <span className="min-w-[2ch] text-center text-sm font-semibold text-accent">
                {config.landingServicesCount ?? LANDING_SERVICES_DEFAULTS[niche]}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Per-service overrides */}
      <div className="rounded-xl border border-border bg-bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-text-secondary">
          <Wrench size={11} /> Personalizar (solo se guardan los campos modificados)
        </div>
        <div className="space-y-2">
          {presetServices
            .filter((s) => visibleSet.has(s.id))
            .map((s) => {
              const patch = overrides[s.id] ?? {};
              const hasOverrides = Object.keys(patch).length > 0;
              return (
                <div
                  key={s.id}
                  className={`rounded-lg border p-2.5 ${
                    hasOverrides ? "border-accent/30 bg-accent/5" : "border-border bg-bg-elevated"
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-bg-card px-1 py-0.5 font-mono text-[10px] text-accent">
                        {s.id}
                      </code>
                      <span className="text-[10px] text-text-muted">{s.label}</span>
                    </div>
                    {hasOverrides && (
                      <span className="text-[10px] text-accent">Editado</span>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <PatchInput
                      label="Nombre"
                      value={(patch.name as string) ?? ""}
                      placeholder={s.label}
                      onChange={(v) => updateOverrideField(s.id, "name", v)}
                    />
                    <PatchInput
                      label="Precio"
                      value={(patch.price as string) ?? ""}
                      placeholder="$"
                      onChange={(v) => updateOverrideField(s.id, "price", v)}
                    />
                    <PatchInput
                      label="Duracion"
                      value={(patch.duration as string) ?? ""}
                      placeholder="30 min"
                      onChange={(v) => updateOverrideField(s.id, "duration", v)}
                    />
                    <PatchInput
                      label="Imagen URL"
                      value={(patch.image as string) ?? ""}
                      onChange={(v) => updateOverrideField(s.id, "image", v)}
                    />
                  </div>
                  <div className="mt-2">
                    <PatchInput
                      label="Descripcion"
                      value={(patch.description as string) ?? ""}
                      onChange={(v) => updateOverrideField(s.id, "description", v)}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Switch to custom */}
      <div className="rounded-lg border border-dashed border-border bg-bg-elevated p-3">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-text-secondary">
          <Plus size={11} /> Agregar servicios fuera del preset
        </div>
        <p className="text-[10px] text-text-muted">
          Cambia a modo custom para crear servicios propios. La lista del preset se materializa
          como punto de partida y podras agregar, sacar o renombrar. Nota: este cliente dejara de
          recibir actualizaciones del preset oficial del nicho.
        </p>
        <button
          type="button"
          onClick={onSwitchToCustom}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20"
        >
          <Plus size={11} /> Pasar a modo custom
        </button>
      </div>
    </div>
  );
}

function PatchInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-text-muted">{label}</label>
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

/* ─── Custom mode ───────────────────────────────────────────────────── */

function CustomServicesEditor({
  services,
  onChange,
  onReturnToPreset,
  clientId,
}: {
  services: Service[];
  onChange: (next: Service[]) => void;
  onReturnToPreset: () => void;
  clientId: string;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([services.length - 1]));
  const [confirmReset, setConfirmReset] = useState(false);
  const lang = useClientLanguage();

  function update(index: number, patch: Partial<Service>) {
    const next = services.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function remove(index: number) {
    onChange(services.filter((_, i) => i !== index));
  }

  function move(from: number, dir: -1 | 1) {
    onChange(moveItem(services, from, from + dir));
  }

  function add() {
    onChange([
      ...services,
      {
        id: `custom-${Date.now().toString(36)}`,
        name: "",
        description: "",
        duration: 30,
        price: 0,
      },
    ]);
    setExpanded((prev) => new Set([...prev, services.length]));
  }

  function toggle(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-300">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Modo custom activo</p>
          <p className="text-amber-300/80">
            Este cliente usa su propia lista de servicios. Las actualizaciones del preset del
            nicho no se aplican automaticamente.
          </p>
        </div>
        {confirmReset ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded border border-border bg-bg-card px-2 py-1 text-[10px] text-text-muted hover:text-text"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onReturnToPreset}
              className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-300 hover:bg-red-500/20"
            >
              Si, descartar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-bg-card px-2 py-1 text-[10px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
            title="Volver al preset (descarta los servicios custom)"
          >
            <RotateCcw size={10} /> Volver al preset
          </button>
        )}
      </div>

      <div className="space-y-2">
        {services.map((s, i) => {
          const isOpen = expanded.has(i);
          const missing: string[] = [];
          if (!s.name.trim()) missing.push("nombre");
          if (!s.id.trim()) missing.push("id");
          return (
            <div
              key={`${s.id}-${i}`}
              className={`rounded-lg border bg-bg-elevated ${
                missing.length > 0 ? "border-amber-500/30" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span className="text-[10px] text-text-muted">{isOpen ? "▼" : "▶"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-text">
                      {s.name || <span className="text-amber-300/80">Sin nombre</span>}
                    </p>
                    <p className="truncate text-[10px] text-text-muted">
                      <code className="font-mono">{s.id}</code>
                      {s.price ? ` · ${s.price}` : ""}
                      {s.duration ? ` · ${s.duration} min` : ""}
                    </p>
                  </div>
                </button>
                <ReorderControls
                  index={i}
                  total={services.length}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  onRemove={() => remove(i)}
                />
              </div>

              {isOpen && (
                <div className="space-y-2 border-t border-border px-3 pb-3 pt-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <PatchInput
                      label="Nombre"
                      value={s.name}
                      onChange={(v) => update(i, { name: v })}
                    />
                    <PatchInput
                      label="ID (slug, unico)"
                      value={s.id}
                      onChange={(v) => update(i, { id: v })}
                      placeholder="corte-clasico"
                    />
                    <NumberInput
                      label="Precio"
                      value={s.price}
                      onChange={(v) => update(i, { price: v })}
                    />
                    <NumberInput
                      label="Duracion (min)"
                      value={s.duration}
                      onChange={(v) => update(i, { duration: v })}
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] text-text-muted">Descripcion</label>
                    <textarea
                      value={s.description}
                      onChange={(e) => update(i, { description: e.target.value })}
                      rows={2}
                      className="w-full resize-none rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                    />
                    <LanguageMismatchWarning
                      fieldId={`${clientId}:services:${s.id}:description`}
                      text={s.description}
                      expected={lang}
                    />
                  </div>
                  <ImageUploadField
                    label="Imagen"
                    value={s.image ?? ""}
                    onChange={(url) => update(i, { image: url || undefined })}
                    clientId={clientId}
                  />
                  <div className="flex items-center justify-between gap-2 rounded border border-border bg-bg-card px-2 py-1.5">
                    <label className="text-[11px] text-text-secondary">Marcar como popular</label>
                    <input
                      type="checkbox"
                      checked={!!s.popular}
                      onChange={(e) => update(i, { popular: e.target.checked })}
                      className="h-3.5 w-3.5 accent-accent"
                    />
                  </div>
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

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={12} /> Agregar servicio
      </button>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-text-muted">{label}</label>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
      />
    </div>
  );
}
