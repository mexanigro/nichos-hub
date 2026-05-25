"use client";

import { useEffect } from "react";
import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps, WizardService } from "@/lib/wizard/wizard-types";
import { NICHE_SERVICES, type BusinessNiche } from "@/lib/client-config/services";

function isValidNiche(niche: string): niche is BusinessNiche {
  return ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones"].includes(niche);
}

export function StepServices({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  useEffect(() => {
    if (data.services.length > 0) return;
    const niche = data.niche === "otro" ? "estetica" : data.niche;
    if (!niche || !isValidNiche(niche)) return;
    const defaults = NICHE_SERVICES[niche];
    const services: WizardService[] = defaults.map((s) => ({
      id: s.id,
      label: s.label,
      price: "",
      duration: "",
      visible: true,
    }));
    updateField("services", services);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleService(index: number) {
    const next = [...data.services];
    next[index] = { ...next[index], visible: !next[index].visible };
    updateField("services", next);
  }

  function updateService(index: number, key: keyof WizardService, value: string) {
    const next = [...data.services];
    next[index] = { ...next[index], [key]: value };
    updateField("services", next);
  }

  function addService() {
    const next = [
      ...data.services,
      { id: `custom-${Date.now()}`, label: "", price: "", duration: "", visible: true },
    ];
    updateField("services", next);
  }

  function removeService(index: number) {
    const next = data.services.filter((_, i) => i !== index);
    updateField("services", next);
  }

  return (
    <WizardStep title={w.servicesTitle} subtitle={w.servicesSub} errors={errors}>
      <div className="wiz-services">
        {data.services.map((s, i) => (
          <div key={s.id} className={`wiz-service-row${s.visible ? "" : " off"}`}>
            <button
              type="button"
              className={`wiz-service-toggle${s.visible ? " on" : ""}`}
              onClick={() => toggleService(i)}
            >
              {s.visible ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              )}
            </button>
            <input
              type="text"
              className="wiz-service-name"
              value={s.label}
              onChange={(e) => updateService(i, "label", e.target.value)}
              placeholder={w.serviceName}
            />
            <input
              type="text"
              className="wiz-service-price"
              inputMode="numeric"
              value={s.price}
              onChange={(e) => updateService(i, "price", e.target.value)}
              placeholder={w.servicePrice}
            />
            <input
              type="text"
              className="wiz-service-dur"
              inputMode="numeric"
              value={s.duration}
              onChange={(e) => updateService(i, "duration", e.target.value)}
              placeholder="Min"
            />
            <button
              type="button"
              className="wiz-service-rm"
              onClick={() => removeService(i)}
              aria-label={w.uploadRemove}
            >
              &times;
            </button>
          </div>
        ))}
        <button type="button" className="wiz-add-btn" onClick={addService}>
          + {w.addService}
        </button>
      </div>
    </WizardStep>
  );
}
