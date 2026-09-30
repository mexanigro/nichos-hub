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

// ── ARREGLOS-03 (D-154): el texto por idioma sigue a su elemento ─────────────────────────────────────────────────────────────
// Borrar un elemento de la raíz o cambiarle el id dejaba su texto huérfano en `translations.<lang>.<sección>.<id>`, y
// `validateTextosPorIdioma` bloqueaba el guardado. Puras; aceptan la capa como objeto por id o como array con `id` y conservan su
// forma; no tocan los otros ids ni ninguna otra clave, y una capa que no cambia es la misma.

const SECCIONES: SeccionTexto[] = ["services", "staff", "testimonials"];

/** Config nuevo con `fn` aplicado a `translations.<lang>.<seccion>` de cada idioma que la tiene. */
function enCadaCapa<C extends object>(config: C, seccion: SeccionTexto, fn: (v: unknown) => unknown): C {
  const c = config as Record<string, unknown>;
  const translations = obj(c.translations);
  let out = translations, cambio = false;
  for (const [idioma, capa] of Object.entries(translations)) {
    const v = obj(capa)[seccion];
    if (v == null) continue;
    const nuevo = fn(v);
    if (nuevo === v) continue;
    out = { ...out, [idioma]: { ...obj(capa), [seccion]: nuevo } };
    cambio = true;
  }
  return cambio ? ({ ...c, translations: out } as C) : config;
}

/** Borra el texto del elemento `id` de `seccion` en cada idioma. */
export function quitarTextoIdioma<C extends object>(config: C, { seccion, id }: { seccion: SeccionTexto; id: string }): C {
  return enCadaCapa(config, seccion, (v) => {
    if (Array.isArray(v)) { const resto = (v as Fila[]).filter((x) => x?.id !== id); return resto.length === v.length ? v : resto; }
    const o = obj(v);
    if (!(id in o)) return v;
    const { [id]: _quitado, ...resto } = o;
    return resto;
  });
}

/** Mueve el texto del elemento `de` a `a` en cada idioma. Si `a` está vacío, o ya tiene texto en una capa, esa capa no cambia:
 *  no se pisa el texto de otro elemento (el huérfano queda y el validador lo nombra). */
export function renombrarTextoIdioma<C extends object>(config: C, { seccion, de, a }: { seccion: SeccionTexto; de: string; a: string }): C {
  if (!de || !a || de === a) return config;
  return enCadaCapa(config, seccion, (v) => {
    if (Array.isArray(v)) {
      const filas = v as Fila[];
      if (!filas.some((x) => x?.id === de) || filas.some((x) => x?.id === a)) return v;
      return filas.map((x) => (x?.id === de ? { ...x, id: a } : x));
    }
    const o = obj(v);
    if (!(de in o) || a in o) return v;
    return Object.fromEntries(Object.entries(o).map(([k, t]) => [k === de ? a : k, t]));
  });
}

/** Lo que el guardado de la ficha manda: `ahora` con `null` en cada `translations.<lang>.<sección>.<id>` que estaba en `antes`
 *  (una capa objeto por id) y ya no está. `PUT /api/config` escribe con `merge: true`, así que una clave que falta se CONSERVA en
 *  Firestore; `null` es lo que `paraFirestore` convierte en borrado. Una capa array se reemplaza entera y no lo necesita. */
export function borradosIdioma<C extends object>(antes: unknown, ahora: C): C {
  const previas = obj(obj(antes).translations);
  const c = ahora as Record<string, unknown>;
  let translations = obj(c.translations), cambio = false;
  for (const [idioma, capaAntes] of Object.entries(previas)) {
    for (const seccion of SECCIONES) {
      const va = obj(capaAntes)[seccion];
      if (!va || typeof va !== "object" || Array.isArray(va)) continue;
      const capa = obj(translations[idioma]);
      if (Array.isArray(capa[seccion])) continue;
      const vn = obj(capa[seccion]);
      const faltan = Object.keys(va).filter((id) => !(id in vn));
      if (!faltan.length) continue;
      translations = { ...translations, [idioma]: { ...capa, [seccion]: { ...vn, ...Object.fromEntries(faltan.map((id) => [id, null])) } } };
      cambio = true;
    }
  }
  return cambio ? ({ ...c, translations } as C) : ahora;
}
