export interface Site {
  id: "barber" | "tattoo" | "nails" | "cafe" | "estetica" | "remod";
  img: string;
}

/** Demos de la landing (sección Ejemplos). El nombre, el rubro y la frase de cada una salen de los locales (`showcase.sites`).
 *  Hueco (LANDING-01, Liam 2026-10-18): son las demos viejas, sin enlace, hasta que haya nuevas. Con las nuevas,
 *  `node --experimental-strip-types scripts/capturas-demos.ts --<id> <url> … --hero <url>` reescribe demo-<id>.png y demo-hero.png;
 *  un rubro distinto cambia también el id de acá y `showcase.sites` en los cinco locales. */
export const SITES: Site[] = [
  { id: "barber",   img: "/landing/demo-barber.png" },
  { id: "tattoo",   img: "/landing/demo-tattoo.png" },
  { id: "nails",    img: "/landing/demo-nails.png" },
  { id: "cafe",     img: "/landing/demo-cafe.png" },
  { id: "estetica", img: "/landing/demo-estetica.png" },
  { id: "remod",    img: "/landing/demo-remod.png" },
];
