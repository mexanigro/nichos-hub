export interface Site {
  id: "barber" | "tattoo" | "nails" | "cafe" | "estetica" | "remod";
  url: string;
  img: string;
}

/** Demos de la landing (sección Ejemplos). El nombre, el rubro y la frase de cada una salen de los locales (`showcase.sites`). */
export const SITES: Site[] = [
  { id: "barber",   url: "barber-shop-template-ten.vercel.app",             img: "/landing/og-barber.png" },
  { id: "tattoo",   url: "demo-martellin-mpfwij1m.arzac.studio",            img: "/landing/og-tattoo.png" },
  { id: "nails",    url: "demo-u-as-de-mar-mpfynv07.arzac.studio",          img: "/landing/og-nails.png" },
  { id: "cafe",     url: "demo-cafe-aristano-mpfwjz7c.arzac.studio",        img: "/landing/og-cafe.png" },
  { id: "estetica", url: "demo-estetica-prueba-mpfvpl5u.arzac.studio",      img: "/landing/og-estetica.png" },
  { id: "remod",    url: "demo-pintureria-el-paolo-mpfwkvuh.arzac.studio",  img: "/landing/og-pintureria.png" },
];
