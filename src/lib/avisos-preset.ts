/**
 * PLANTILLA-01 (D-263, inciso z) · ninguna web de una clienta sale con equipo o reseñas que no son de ella.
 * El alta le pone a un cliente el equipo del preset del nicho (`provisioning.ts`, `staff: preset.staff`) y ninguna reseña; sin
 * `staff` o sin `testimonials` la página de T cae a los del preset. El equipo, además, sale en la reserva («elegir profesional»), con
 * la sección oculta o no: para el equipo la única salida es cargar lo real. Las reseñas se cargan o se oculta la sección.
 * El aviso no bloquea nada: lo imprimen las consolas y la guía lo pide en cero antes del redeploy.
 * Techo: una reseña con el texto del preset pegado a mano no se reconoce (H no tiene la lista de reseñas del preset).
 */
import { getNichePreset } from "./client-config/niche-presets.ts";
import type { BusinessNiche } from "./client-config/services.ts";

/** MARCA-01 (D-289): «material» lo suman desde-plantilla y la consola de textos (`avisosDeMaterialDePlantilla`, material-cliente.ts). */
export type AvisoPreset = { seccion: "equipo" | "reseñas" | "material"; message: string };

type Obj = Record<string, any>;
const lista = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []);

export function avisosDePreset(config: unknown, niche: string): AvisoPreset[] {
  const c: Obj = config && typeof config === "object" ? (config as Obj) : {};
  const preset = lista(getNichePreset(niche as BusinessNiche)?.staff);
  const slugs = new Set(preset.map((p) => p.slug).filter(Boolean)), nombres = new Set(preset.map((p) => p.name).filter(Boolean));
  const avisos: AvisoPreset[] = [];

  const staff = lista(c.staff);
  const ajenas = staff.filter((s) => slugs.has(s.slug) || nombres.has(s.name));
  if (!staff.length || ajenas.length) {
    const quienes = (staff.length ? ajenas : preset).map((p) => p.name).filter(Boolean).join(", ");
    avisos.push({
      seccion: "equipo",
      message: `${staff.length ? "El equipo tiene personas del preset" : "No hay equipo: la página y la reserva muestran el del preset"} (${quienes}). Cargá el equipo real por la casilla de Equipo (una sola persona si trabaja sola). Ocultar la sección no alcanza: la reserva lista a las personas en «elegir profesional».`,
    });
  }

  if (!lista(c.testimonials).length && c.features?.showTestimonials !== false) {
    avisos.push({
      seccion: "reseñas",
      message: "No hay reseñas de la clienta: con la sección a la vista, la página muestra las del preset. Cargá las reales por la casilla de Testimonios, u ocultá la sección con features.showTestimonials en false.",
    });
  }
  return avisos;
}

/** Las líneas que imprimen las consolas. */
export const lineasDeAvisos = (avisos: AvisoPreset[]) =>
  avisos.length ? ["AVISOS (inciso z: equipo y reseñas reales, o la sección de reseñas oculta; MARCA-01: el material de la clienta en su paleta; antes del redeploy):", ...avisos.map((a) => `  ! ${a.seccion}: ${a.message}`)] : ["avisos: ninguno (equipo y reseñas de la clienta)"];
