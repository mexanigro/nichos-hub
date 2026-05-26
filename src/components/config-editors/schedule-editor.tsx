"use client";

import { Plus, Trash2, Coffee } from "lucide-react";

/**
 * Schedule editor for a staff member's weekly schedule.
 *
 * Matches master-template's `WeeklySchedule`:
 *   { monday: WorkDay, tuesday: WorkDay, ... }
 *   WorkDay = { isOpen: boolean; hours: { start, end }; breaks: SessionBreak[] }
 *   SessionBreak = { start, end, label }
 *
 * Rationale for shipping this in the hub: the booking engine in the template
 * relies on `staff[i].schedule` to compute available slots. When the hub
 * lets the owner add staff via the new CRUD editor, those new entries land
 * in Firestore without a schedule and break booking. This editor lets the
 * owner set a sane default per day + per-day breaks if needed.
 */

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<typeof DAYS[number], string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miercoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sabado",
  sunday: "Domingo",
};

export type TimeRange = { start: string; end: string };
export type SessionBreak = TimeRange & { label: string };
export type WorkDay = { isOpen: boolean; hours: TimeRange; breaks: SessionBreak[] };
export type WeeklySchedule = Record<typeof DAYS[number], WorkDay>;

/** Default open day matching master-template's typical preset. */
export function defaultWorkDay(): WorkDay {
  return { isOpen: true, hours: { start: "09:00", end: "18:00" }, breaks: [] };
}

/** Default schedule for a brand-new staff member. */
export function defaultWeeklySchedule(): WeeklySchedule {
  return {
    monday: defaultWorkDay(),
    tuesday: defaultWorkDay(),
    wednesday: defaultWorkDay(),
    thursday: defaultWorkDay(),
    friday: defaultWorkDay(),
    saturday: { isOpen: false, hours: { start: "09:00", end: "14:00" }, breaks: [] },
    sunday: { isOpen: false, hours: { start: "09:00", end: "14:00" }, breaks: [] },
  };
}

export function ScheduleEditor({
  value,
  onChange,
}: {
  value: WeeklySchedule | undefined;
  onChange: (next: WeeklySchedule) => void;
}) {
  const schedule = value ?? defaultWeeklySchedule();

  function updateDay(day: typeof DAYS[number], patch: Partial<WorkDay>) {
    onChange({ ...schedule, [day]: { ...schedule[day], ...patch } });
  }

  function toggleDay(day: typeof DAYS[number]) {
    updateDay(day, { isOpen: !schedule[day].isOpen });
  }

  function updateHours(day: typeof DAYS[number], patch: Partial<TimeRange>) {
    updateDay(day, { hours: { ...schedule[day].hours, ...patch } });
  }

  function addBreak(day: typeof DAYS[number]) {
    updateDay(day, {
      breaks: [...schedule[day].breaks, { start: "13:00", end: "14:00", label: "Almuerzo" }],
    });
  }

  function updateBreak(day: typeof DAYS[number], i: number, patch: Partial<SessionBreak>) {
    const breaks = schedule[day].breaks.slice();
    breaks[i] = { ...breaks[i], ...patch };
    updateDay(day, { breaks });
  }

  function removeBreak(day: typeof DAYS[number], i: number) {
    updateDay(day, { breaks: schedule[day].breaks.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-3">
      <p className="mb-2 text-[11px] font-semibold text-text-secondary">Horario semanal</p>
      <p className="mb-3 text-[10px] text-text-muted">
        Define cuando este miembro acepta turnos. El booking engine usa estos horarios para
        calcular disponibilidad. Si no editas, se usa un horario por defecto (L-V 09-18).
      </p>
      <div className="space-y-1.5">
        {DAYS.map((day) => {
          const d = schedule[day];
          const hoursInvalid = d.isOpen && d.hours.start >= d.hours.end;
          return (
            <div
              key={day}
              className={`rounded border p-2 ${
                hoursInvalid ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-bg-card"
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex h-5 w-9 items-center rounded-full transition-colors ${
                    d.isOpen ? "bg-accent" : "bg-bg-active"
                  }`}
                  aria-label={d.isOpen ? "Cerrar dia" : "Abrir dia"}
                >
                  <span
                    className={`h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      d.isOpen ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="w-20 text-xs font-medium text-text">{DAY_LABELS[day]}</span>
                {d.isOpen ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="time"
                      value={d.hours.start}
                      onChange={(e) => updateHours(day, { start: e.target.value })}
                      className="rounded border border-border bg-bg-elevated px-1.5 py-0.5 text-xs text-text focus:border-accent focus:outline-none"
                    />
                    <span className="text-[10px] text-text-muted">a</span>
                    <input
                      type="time"
                      value={d.hours.end}
                      onChange={(e) => updateHours(day, { end: e.target.value })}
                      className="rounded border border-border bg-bg-elevated px-1.5 py-0.5 text-xs text-text focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => addBreak(day)}
                      title="Agregar break"
                      className="ml-auto inline-flex items-center gap-1 rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] text-text-muted hover:border-accent hover:text-accent"
                    >
                      <Coffee size={9} /> Break
                    </button>
                  </div>
                ) : (
                  <span className="flex-1 text-[10px] text-text-muted">Cerrado</span>
                )}
              </div>

              {d.isOpen && d.breaks.length > 0 && (
                <div className="ml-11 mt-1.5 space-y-1">
                  {d.breaks.map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px]">
                      <input
                        type="text"
                        value={b.label}
                        onChange={(e) => updateBreak(day, i, { label: e.target.value })}
                        placeholder="Almuerzo"
                        className="w-20 rounded border border-border bg-bg-card px-1.5 py-0.5 text-[10px] text-text focus:border-accent focus:outline-none"
                      />
                      <input
                        type="time"
                        value={b.start}
                        onChange={(e) => updateBreak(day, i, { start: e.target.value })}
                        className="rounded border border-border bg-bg-card px-1.5 py-0.5 text-[10px] text-text focus:border-accent focus:outline-none"
                      />
                      <span className="text-text-muted">a</span>
                      <input
                        type="time"
                        value={b.end}
                        onChange={(e) => updateBreak(day, i, { end: e.target.value })}
                        className="rounded border border-border bg-bg-card px-1.5 py-0.5 text-[10px] text-text focus:border-accent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeBreak(day, i)}
                        aria-label="Eliminar break"
                        className="rounded p-0.5 text-text-muted hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {hoursInvalid && (
                <p className="ml-11 mt-1 text-[10px] text-amber-300/80">
                  La hora de inicio ({d.hours.start}) debe ser anterior a la de cierre ({d.hours.end}).
                </p>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onChange(defaultWeeklySchedule())}
        className="mt-2 inline-flex items-center gap-1 rounded border border-dashed border-border px-2 py-1 text-[10px] text-text-muted hover:border-accent hover:text-accent"
        title="Restaurar L-V 09-18, sabado y domingo cerrados"
      >
        <Plus size={9} /> Restaurar horario por defecto
      </button>
    </div>
  );
}
