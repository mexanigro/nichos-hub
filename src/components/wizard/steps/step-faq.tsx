"use client";

import { WizardStep } from "../wizard-step";
import { WizardRefImage } from "../wizard-ref-image";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";
import type { WizardFaq } from "@/lib/wizard/wizard-types";

export function StepFaq({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const items: WizardFaq[] = data.faqItems || [];

  function update(i: number, patch: Partial<WizardFaq>) {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    updateField("faqItems", next);
  }

  function add() {
    updateField("faqItems", [...items, { q: "", a: "" }]);
  }

  function remove(i: number) {
    updateField("faqItems", items.filter((_, j) => j !== i));
  }

  return (
    <WizardStep
      title={w.faqTitle || "Preguntas frecuentes"}
      subtitle={w.faqSub || ""}
      errors={errors}
    >
      <div className="wiz-fields">
        <WizardRefImage data={data} stepKey="faq" />
        {items.length === 0 && (
          <p className="wiz-hint" style={{ marginBottom: 8 }}>
            Pensá en las 3-5 que te hacen siempre por WhatsApp antes de reservar.
            Si lo dejás vacío, armo un set genérico y vos lo afinás.
          </p>
        )}
        {items.map((f, i) => (
          <div key={i} className="wiz-list-item">
            <div className="wiz-field">
              <label>{w.faqQuestion || "Pregunta"}</label>
              <input
                type="text"
                value={f.q}
                onChange={(e) => update(i, { q: e.target.value })}
                placeholder="Ej: ¿Hace falta sacar turno antes?"
              />
            </div>
            <div className="wiz-field">
              <label>{w.faqAnswer || "Respuesta"}</label>
              <textarea
                value={f.a}
                onChange={(e) => update(i, { a: e.target.value })}
                placeholder="Recomendado, pero también atendemos walk-in si hay disponibilidad."
                rows={2}
              />
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
          + {w.faqAdd || "Agregar pregunta"}
        </button>
      </div>
    </WizardStep>
  );
}
