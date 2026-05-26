"use client";

import { WizardStep } from "../wizard-step";
import { WizardRefImage } from "../wizard-ref-image";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";
import type { WizardBenefit } from "@/lib/wizard/wizard-types";

const ICON_PRESETS = ["Award", "Star", "Heart", "Shield", "Clock", "Users", "Sparkles", "Zap"];

export function StepBenefits({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const items: WizardBenefit[] = data.benefits || [];

  function update(i: number, patch: Partial<WizardBenefit>) {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    updateField("benefits", next);
  }

  function add() {
    updateField("benefits", [...items, { title: "", desc: "", iconName: "Star" }]);
  }

  function remove(i: number) {
    updateField("benefits", items.filter((_, j) => j !== i));
  }

  return (
    <WizardStep
      title={w.benefitsTitle || "¿Por qué te eligen?"}
      subtitle={w.benefitsSub || ""}
      errors={errors}
    >
      <div className="wiz-fields">
        <WizardRefImage data={data} stepKey="benefits" />
        {items.length === 0 && (
          <p className="wiz-hint" style={{ marginBottom: 8 }}>
            Tu sitio puede mostrar 3 a 5 razones para confiar. Si lo dejás vacío,
            uso un set genérico del rubro y vos lo afinás después.
          </p>
        )}
        {items.map((b, i) => (
          <div key={i} className="wiz-list-item">
            <div className="wiz-field">
              <label>{w.benefitTitle || "Título"}</label>
              <input
                type="text"
                value={b.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder="Ej: 15 años de experiencia"
              />
            </div>
            <div className="wiz-field">
              <label>{w.benefitDesc || "Descripción corta"}</label>
              <input
                type="text"
                value={b.desc}
                onChange={(e) => update(i, { desc: e.target.value })}
                placeholder="Una línea explicando por qué importa."
              />
            </div>
            <div className="wiz-field">
              <label>{w.benefitIcon || "Ícono"}</label>
              <select
                value={b.iconName}
                onChange={(e) => update(i, { iconName: e.target.value })}
              >
                {ICON_PRESETS.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="wiz-link-btn danger"
              onClick={() => remove(i)}
            >
              {w.benefitRemove || "Eliminar"}
            </button>
          </div>
        ))}
        <button type="button" className="wiz-add-btn" onClick={add}>
          + {w.benefitAdd || "Agregar beneficio"}
        </button>
      </div>
    </WizardStep>
  );
}
