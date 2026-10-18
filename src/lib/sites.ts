export interface Site {
  id: "barber" | "tattoo" | "nails" | "cafe" | "estetica" | "remod";
  img: string;
}

/** Demos de la landing (sección Ejemplos). El nombre, el rubro y la frase de cada una salen de los locales (`showcase.sites`). */
export const SITES: Site[] = [
  { id: "barber",   img: "/landing/og-barber.png" },
  { id: "tattoo",   img: "/landing/og-tattoo.png" },
  { id: "nails",    img: "/landing/og-nails.png" },
  { id: "cafe",     img: "/landing/og-cafe.png" },
  { id: "estetica", img: "/landing/og-estetica.png" },
  { id: "remod",    img: "/landing/og-pintureria.png" },
];
