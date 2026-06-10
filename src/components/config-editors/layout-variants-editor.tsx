"use client";

/**
 * Editor del sistema de 5 variantes (v1-v5) del master-template.
 *
 * Cada seccion del landing (mas navbar/footer/stats del hero) tiene 5
 * layouts intercambiables. "v1" = el diseño original shippeado; v2-v5 son
 * los layouts nuevos. La seleccion se persiste en Firestore config/{clientId}
 * en el path que el template lee al arrancar:
 *
 *   hero.variant                    sections.services.variant
 *   hero.statsBar.variant           sections.team.variant
 *   navbar.variant                  sections.whyChooseUs.variant
 *   footer.variant                  sections.gallery.variant
 *                                   sections.testimonials.variant
 *                                   sections.instagram.variant
 *                                   sections.faq.variant
 *                                   sections.contact.variant
 *
 * (splash.variant se maneja en la seccion "Splash screen" existente.)
 *
 * UI: segmented control v1-v5 por seccion + nombre/descripcion de la
 * variante activa. Sin thumbnails — el preview embebido del cliente es la
 * referencia visual real despues de guardar.
 */

export type SectionVariantValue = "v1" | "v2" | "v3" | "v4" | "v5";

const VARIANT_VALUES: readonly SectionVariantValue[] = ["v1", "v2", "v3", "v4", "v5"];

type VariantInfo = { name: string; desc: string };

type LayoutSectionSpec = {
  /** Path en el config doc (updateNested/getNested). */
  path: string;
  label: string;
  variants: Record<SectionVariantValue, VariantInfo>;
};

const V1: VariantInfo = { name: "Original", desc: "El diseño actual del template, sin cambios." };

export const LAYOUT_VARIANT_SECTIONS: readonly LayoutSectionSpec[] = [
  {
    path: "navbar.variant",
    label: "Navbar",
    variants: {
      v1: V1,
      v2: { name: "Logo centrado", desc: "Boutique de lujo: logo al centro, links repartidos a ambos lados." },
      v3: { name: "Hamburguesa siempre", desc: "Barra minimal + menu editorial fullscreen en todos los breakpoints." },
      v4: { name: "Barra inferior mobile", desc: "App-like: tab bar fija abajo en mobile, barra clasica en desktop." },
      v5: { name: "Overlay transparente", desc: "Transparente sobre el hero, se solidifica con glass al scrollear." },
    },
  },
  {
    path: "hero.variant",
    label: "Hero",
    variants: {
      v1: V1,
      v2: { name: "Split editorial", desc: "Dos columnas estilo revista: tipografia oversized + foto enmarcada." },
      v3: { name: "Video de fondo", desc: "Video en loop detras del titulo (usa hero.videoUrl)." },
      v4: { name: "Minimal centrado", desc: "Composicion centrada y despojada, maximo aire." },
      v5: { name: "Capas parallax", desc: "Fondo, palabra gigante y contenido a distintas velocidades de scroll." },
    },
  },
  {
    path: "hero.statsBar.variant",
    label: "Stats del hero",
    variants: {
      v1: V1,
      v2: { name: "Cinta deslizante", desc: "Pills en marquee horizontal continuo." },
      v3: { name: "Contadores animados", desc: "Numeros que cuentan al entrar en viewport, panel serif." },
      v4: { name: "Cards con iconos", desc: "Tarjetas individuales con icono + hover por nicho." },
      v5: { name: "Inline minimal", desc: "Texto plano en una linea con separadores." },
    },
  },
  {
    path: "sections.services.variant",
    label: "Servicios",
    variants: {
      v1: V1,
      v2: { name: "Rail con scroll", desc: "Carrusel horizontal de cards anchas con drag/scroll." },
      v3: { name: "Acordeon editorial", desc: "Filas numeradas que expanden descripcion, foto y CTA." },
      v4: { name: "Grilla con tabs", desc: "Tabs por categoria + grilla de cards con crossfade." },
      v5: { name: "Masonry", desc: "Cards escalonadas con pill de precio." },
    },
  },
  {
    path: "sections.team.variant",
    label: "Equipo",
    variants: {
      v1: V1,
      v2: { name: "Carrusel horizontal", desc: "Cards verticales en rail deslizable." },
      v3: { name: "Grilla con bio al hover", desc: "Fotos grandes; la bio aparece al pasar el mouse." },
      v4: { name: "Destacado + lista", desc: "Un miembro en grande + el resto en lista lateral compacta." },
      v5: { name: "Avatares minimal", desc: "Fila de circulos en B/N que toman color al hover." },
    },
  },
  {
    path: "sections.whyChooseUs.variant",
    label: "Por que elegirnos",
    variants: {
      v1: V1,
      v2: { name: "Timeline vertical", desc: "Beneficios como hitos sobre una linea de progreso." },
      v3: { name: "Tabla comparativa", desc: "\"Nosotros vs. lo habitual\" con checks y guiones." },
      v4: { name: "Contadores animados", desc: "Lista numerada con metricas que cuentan al entrar." },
      v5: { name: "Hibrido con testimonio", desc: "Split beneficios + quote de cliente embebida." },
    },
  },
  {
    path: "sections.gallery.variant",
    label: "Galeria",
    variants: {
      v1: V1,
      v2: { name: "Muro masonry", desc: "Mosaico editorial de alturas variables." },
      v3: { name: "Carrusel lightbox", desc: "Imagen principal + thumbnails, fullscreen al click." },
      v4: { name: "Slider antes/despues", desc: "Comparador deslizable de transformaciones." },
      v5: { name: "Tablero Pinterest", desc: "Pin-board de columnas con hover zoom." },
    },
  },
  {
    path: "sections.testimonials.variant",
    label: "Testimonios",
    variants: {
      v1: V1,
      v2: { name: "Carrusel", desc: "Un testimonio por slide con dots y flechas." },
      v3: { name: "Cards masonry", desc: "Mosaico de quotes de alturas variables." },
      v4: { name: "Video testimonios", desc: "Grilla con videos de clientes (usa videoUrl)." },
      v5: { name: "Resumen de rating", desc: "Promedio gigante + barras de distribucion + lista." },
    },
  },
  {
    path: "sections.instagram.variant",
    label: "Instagram",
    variants: {
      v1: V1,
      v2: { name: "Estilo stories", desc: "Rail horizontal de frames verticales tipo stories." },
      v3: { name: "Grilla con captions", desc: "Posts con barra de handle + numero." },
      v4: { name: "Destacado + grilla", desc: "Un post grande con CTA de follow + grilla compacta." },
      v5: { name: "Marquee automatico", desc: "Carrusel infinito con pill del handle al centro." },
    },
  },
  {
    path: "sections.faq.variant",
    label: "FAQ",
    variants: {
      v1: V1,
      v2: { name: "Dos columnas", desc: "Preguntas repartidas en dos columnas de acordeones." },
      v3: { name: "Con buscador", desc: "Input de busqueda que filtra las preguntas en vivo." },
      v4: { name: "Tabs por categoria", desc: "Preguntas agrupadas en pestañas tematicas." },
      v5: { name: "Estilo chat", desc: "Pregunta y respuesta como burbujas de conversacion." },
    },
  },
  {
    path: "sections.contact.variant",
    label: "Contacto",
    variants: {
      v1: V1,
      v2: { name: "Split mapa + form", desc: "Formulario a un lado, mapa y datos al otro." },
      v3: { name: "Card flotante", desc: "Tarjeta de contacto sobre foto a sangre completa." },
      v4: { name: "Inline minimal", desc: "Form de una linea + datos condensados en una fila." },
      v5: { name: "Inmersivo", desc: "Seccion oscura full-bleed con foto y formulario integrado." },
    },
  },
  {
    path: "footer.variant",
    label: "Footer",
    variants: {
      v1: V1,
      v2: { name: "Una linea minimal", desc: "Barra unica: brand, links esenciales, social y copyright." },
      v3: { name: "Mega columnas", desc: "Columnas de links + contacto + horarios (acordeon en mobile)." },
      v4: { name: "Stack centrado", desc: "Todo apilado y centrado con mucho aire." },
      v5: { name: "Contraste oscuro", desc: "Bloque oscuro de alto contraste sin importar el theme." },
    },
  },
] as const;

export function LayoutVariantsEditor({
  getNested,
  updateNested,
}: {
  getNested: (path: string) => unknown;
  updateNested: (path: string, value: unknown) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {LAYOUT_VARIANT_SECTIONS.map((spec) => {
        const raw = getNested(spec.path);
        const current: SectionVariantValue = VARIANT_VALUES.includes(raw as SectionVariantValue)
          ? (raw as SectionVariantValue)
          : "v1";
        const info = spec.variants[current];

        return (
          <div key={spec.path} className="rounded-lg border border-border bg-bg-elevated p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-text-secondary">{spec.label}</p>
              <div className="flex overflow-hidden rounded-md border border-border">
                {VARIANT_VALUES.map((v) => {
                  const isSelected = v === current;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        // v1 = default del template → borramos el campo
                        // (null se convierte en FieldValue.delete() al guardar)
                        updateNested(spec.path, v === "v1" ? null : v)
                      }
                      className={`px-2 py-1 font-mono text-[10px] font-semibold transition-colors ${
                        isSelected
                          ? "bg-accent text-white"
                          : "bg-bg-card text-text-muted hover:bg-bg-active hover:text-text-secondary"
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-xs font-medium text-text">{info.name}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-text-muted">{info.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
