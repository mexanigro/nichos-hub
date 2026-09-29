/**
 * Texto por idioma de servicios, equipo y reseñas (IDIOMAS-01, D11-1..3). La estructura (ids, precios, fotos, orden) vive en la
 * raíz y es la misma en los cuatro idiomas; el texto del idioma base vive en el elemento de la raíz y el de los otros en
 * `translations.<lang>.<sección>.<id>.<campo>` (objeto por id; un array con `id` también se lee, y al escribir pasa a objeto).
 * Puras: devuelven un config nuevo y no tocan ninguna otra clave. Las usan las casillas de servicios, equipo y reseñas.
 */
export type SeccionTexto = "services" | "staff" | "testimonials";
type Donde = { seccion: SeccionTexto; id: string; campo: string; idioma: string; base: string };
type Fila = Record<string, unknown>;

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** La capa `translations.<idioma>.<sección>` como objeto por id (acepta el array con `id`). */
function porId(v: unknown): Record<string, Fila> {
  if (!Array.isArray(v)) return { ...(obj(v) as Record<string, Fila>) };
  const out: Record<string, Fila> = {};
  for (const x of v as Fila[]) if (x && typeof x.id === "string") { const { id, ...resto } = x; out[id as string] = resto; }
  return out;
}

/** Lo que la casilla muestra: en el idioma base, el campo de la raíz; en otro, el de la capa, o "" (pendiente). */
export function leerTextoIdioma(config: unknown, { seccion, id, campo, idioma, base }: Donde): string {
  const c = obj(config);
  const v = idioma === base
    ? (Array.isArray(c[seccion]) ? (c[seccion] as Fila[]).find((x) => x?.id === id)?.[campo] : undefined)
    : porId(obj(obj(c.translations)[idioma])[seccion])[id]?.[campo];
  return typeof v === "string" ? v : "";
}

/** Escribe el texto de `campo` del elemento `id`: en el idioma base en la raíz; en otro, en `translations.<idioma>`. */
export function aplicarTextoIdioma<C extends object>(config: C, { seccion, id, campo, valor, idioma, base }: Donde & { valor: string }): C {
  const c = config as Record<string, unknown>;
  if (idioma === base) {
    const filas = Array.isArray(c[seccion]) ? (c[seccion] as Fila[]) : [];
    return { ...c, [seccion]: filas.map((x) => (x?.id === id ? { ...x, [campo]: valor } : x)) } as C;
  }
  const translations = obj(c.translations);
  const capa = obj(translations[idioma]);
  const textos = porId(capa[seccion]);
  textos[id] = { ...(textos[id] ?? {}), [campo]: valor };
  return { ...c, translations: { ...translations, [idioma]: { ...capa, [seccion]: textos } } } as C;
}
