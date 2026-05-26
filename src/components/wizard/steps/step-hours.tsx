"use client";

import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps, DaySchedule } from "@/lib/wizard/wizard-types";

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/* Mini wireframe showing how hours appear in the contact section */
function HoursMockup() {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie"];
  return (
    <div className="wiz-mockup" aria-hidden>
      <div className="wiz-mockup-section-title" />
      <div className="wiz-mockup-hours-grid">
        {days.map((d, i) => (
          <div key={d} className="wiz-mockup-hour-row">
            <span className="wiz-mockup-day">{d}</span>
            <span className={`wiz-mockup-time${i === 5 ? " short" : ""}`} />
          </div>
        ))}
      </div>
      <div className="wiz-mockup-label">Tus horarios aparecen acá ↑</div>
    </div>
  );
}

export function StepHours({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  function updateDay(dayKey: string, field: keyof DaySchedule, value: unknown) {
    const next = { ...data.hours };
    next[dayKey] = { ...next[dayKey], [field]: value };
    updateField("hours", next);
  }

  return (
    <WizardStep title={w.hoursTitle} subtitle={w.hoursSub} errors={errors}>
      <p className="wiz-ctx">{w.hoursCtx}</p>
      <HoursMockup />
      <div className="wiz-hours">
        {DAY_KEYS.map((key, i) => {
          const day = data.hours[key];
          if (!day) return null;
          return (
            <div key={key} className={`wiz-hour-row${day.isOpen ? "" : " closed"}`}>
              <button
                type="button"
                className={`wiz-hour-toggle${day.isOpen ? " on" : ""}`}
                onClick={() => updateDay(key, "isOpen", !day.isOpen)}
                title={day.isOpen ? "Marcar como cerrado" : "Marcar como abierto"}
              >
                <span className="wiz-hour-dot" />
              </button>
              <span className="wiz-hour-label">{w.dayNames[i]}</span>
              {day.isOpen ? (
                <div className="wiz-hour-times">
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => updateDay(key, "open", e.target.value)}
                  />
                  <span className="wiz-hour-sep">&mdash;</span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => updateDay(key, "close", e.target.value)}
                  />
                </div>
              ) : (
                <span className="wiz-hour-closed">{w.closed}</span>
              )}
            </div>
          );
        })}
      </div>
    </WizardStep>
  );
}
