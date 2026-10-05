/**
 * Las secciones y campos de texto de la pestaña Contenido por nicho. Vive aquí, fuera del módulo "use client" de la pestaña, porque
 * la ruta generate-content (servidor) la usa para el catálogo de textos (ALTA-IDIOMAS-01, D-242: medido con npm run build, desde el
 * módulo de la pestaña la ruta recibía una referencia de cliente que lanza «Attempted to call seccionesDeContenido() from the
 * server»). La pestaña la reexporta.
 */
import type { PlaceholderKey } from "./dashboard-placeholders.ts";

export interface ContentSection {
  key: string;
  label: string;
  fields: ContentField[];
}

export interface ContentField {
  path: string;
  label: string;
  type: "text" | "textarea";
  /** Clave en el dict de placeholders. La UI traduce según el idioma del cliente. */
  placeholderKey?: PlaceholderKey;
}

const BASE_SECTIONS: ContentSection[] = [
  {
    key: "hero",
    label: "Hero",
    fields: [
      // CONEXION-06 (D-72): el eyebrow va arriba del titular; el hero v6 lo recorta a 4 palabras (clampWords) y la flota lo rinde igual.
      { path: "hero.eyebrow", label: "Eyebrow (≤ 4 palabras)", type: "text" },
      { path: "hero.titlePrefix", label: "Prefijo del titulo", type: "text", placeholderKey: "heroTitlePrefix" },
      { path: "hero.titleHighlight", label: "Titulo destacado", type: "text", placeholderKey: "heroTitleHighlight" },
      { path: "hero.titleSuffix", label: "Sufijo del titulo", type: "text" },
      { path: "hero.subtitle", label: "Subtitulo", type: "textarea", placeholderKey: "heroSubtitle" },
      { path: "hero.ctaPrimary", label: "Boton principal (CTA)", type: "text", placeholderKey: "heroCtaPrimary" },
      { path: "hero.ctaSecondary", label: "Boton secundario", type: "text", placeholderKey: "heroCtaSecondary" },
    ],
  },
  {
    key: "services",
    label: "Servicios",
    fields: [
      { path: "sections.services.title", label: "Titulo de seccion", type: "text", placeholderKey: "servicesTitle" },
      { path: "sections.services.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "whyChooseUs",
    label: "Por que elegirnos",
    fields: [
      { path: "sections.whyChooseUs.title", label: "Titulo", type: "text", placeholderKey: "whyChooseUsTitle" },
      { path: "sections.whyChooseUs.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "team",
    label: "Equipo",
    fields: [
      { path: "sections.team.title", label: "Titulo", type: "text", placeholderKey: "teamTitle" },
      { path: "sections.team.subtitle", label: "Subtitulo", type: "text" },
      { path: "sections.team.description", label: "Descripcion", type: "textarea" },
    ],
  },
  {
    key: "testimonials",
    label: "Testimonios",
    fields: [
      { path: "sections.testimonials.title", label: "Titulo", type: "text", placeholderKey: "testimonialsTitle" },
      { path: "sections.testimonials.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "gallery",
    label: "Galeria",
    fields: [
      { path: "sections.gallery.title", label: "Titulo", type: "text", placeholderKey: "galleryTitle" },
      { path: "sections.gallery.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "location",
    label: "Ubicacion",
    fields: [
      { path: "sections.location.title", label: "Titulo", type: "text", placeholderKey: "locationTitle" },
      { path: "sections.location.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "contact",
    label: "Contacto",
    fields: [
      { path: "sections.contact.title", label: "Titulo", type: "text", placeholderKey: "contactTitle" },
      { path: "sections.contact.subtitle", label: "Subtitulo", type: "text" },
      { path: "sections.contact.description", label: "Descripcion", type: "textarea" },
    ],
  },
  {
    // CONTACTO-PIE-01 (D-205, inciso v): contacto y el pie leen la dirección y la línea de la marca en cada idioma
    // (`translations.<lang>.contact.address`, `translations.<lang>.brand.tagline`); en el idioma base escribe la raíz, como la pestaña Config.
    key: "address",
    label: "Direccion y linea de la marca",
    fields: [
      { path: "contact.address.street", label: "Calle", type: "text" },
      { path: "contact.address.district", label: "Barrio", type: "text" },
      { path: "contact.address.cityStateZip", label: "Ciudad", type: "text" },
      { path: "brand.tagline", label: "Linea de la marca (pie de pagina)", type: "text" },
      // CIERRE-TRAMO-01 (D-219): la descripción la leen el SEO y «sobre nosotros» en cada idioma (`translations.<lang>.brand.description`).
      { path: "brand.description", label: "Descripcion de la marca (SEO y sobre nosotros)", type: "textarea" },
    ],
  },
  {
    key: "booking",
    label: "Reservas",
    fields: [
      { path: "sections.booking.title", label: "Titulo", type: "text", placeholderKey: "bookingTitle" },
      { path: "sections.booking.tagline", label: "Tagline", type: "text", placeholderKey: "bookingTagline" },
    ],
  },
];

const CAFETERIA_SECTIONS: ContentSection[] = [
  {
    key: "philosophy",
    label: "Filosofia",
    fields: [
      { path: "sections.philosophy.title", label: "Titulo", type: "text", placeholderKey: "philosophyTitle" },
      { path: "sections.philosophy.subtitle", label: "Subtitulo", type: "text" },
      { path: "sections.philosophy.intro", label: "Introduccion", type: "textarea" },
    ],
  },
  {
    key: "process",
    label: "Proceso",
    fields: [
      { path: "sections.process.title", label: "Titulo", type: "text", placeholderKey: "processTitle" },
      { path: "sections.process.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "ambience",
    label: "Ambiente",
    fields: [
      { path: "sections.ambience.title", label: "Titulo", type: "text", placeholderKey: "ambienceTitle" },
      { path: "sections.ambience.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
];

const REMODELACIONES_SECTIONS: ContentSection[] = [
  {
    key: "portfolio",
    label: "Portfolio",
    fields: [
      { path: "sections.portfolio.title", label: "Titulo", type: "text", placeholderKey: "portfolioTitle" },
      { path: "sections.portfolio.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
  {
    key: "process",
    label: "Proceso",
    fields: [
      { path: "sections.process.title", label: "Titulo", type: "text", placeholderKey: "processTitle" },
      { path: "sections.process.subtitle", label: "Subtitulo", type: "text" },
    ],
  },
];

const FAQ_SECTION: ContentSection = {
  key: "faq",
  label: "Preguntas Frecuentes (FAQ)",
  fields: [
    { path: "sections.faq.title", label: "Titulo", type: "text", placeholderKey: "faqTitle" },
    { path: "sections.faq.subtitle", label: "Subtitulo", type: "text", placeholderKey: "faqSubtitle" },
  ],
};

/** Las secciones y campos de la pestaña Contenido para un nicho (CONTACTO-PIE-01, C5: exportada para ejecutar el camino sin navegador). */
export function seccionesDeContenido(niche: string): ContentSection[] {
  const sections = [...BASE_SECTIONS];
  if (niche === "cafeteria") sections.push(...CAFETERIA_SECTIONS);
  if (niche === "remodelaciones") sections.push(...REMODELACIONES_SECTIONS);
  sections.push(FAQ_SECTION);
  return sections;
}

