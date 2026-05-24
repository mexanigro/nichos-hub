export interface Site {
  id: string;
  niche: string;
  city: string;
  url: string;
  img: string;
}

export const SITES: Site[] = [
  { id: "barber",   niche: "Barbershop",        city: "TLV",  url: "barber-shop-template-ten.vercel.app",  img: "/landing/og-barber.png" },
  { id: "tattoo",   niche: "Tattoo & Piercing", city: "BCN",  url: "demo-martellin-mpfwij1m.arzac.studio", img: "/landing/og-tattoo.png" },
  { id: "nails",    niche: "Nail studio",       city: "MDQ",  url: "demo-u-as-de-mar-mpfynv07.arzac.studio", img: "/landing/og-nails.png" },
  { id: "cafe",     niche: "Café",              city: "TLV",  url: "demo-cafe-aristano-mpfwjz7c.arzac.studio", img: "/landing/og-cafe.png" },
  { id: "estetica", niche: "Aesthetic clinic",  city: "BUE",  url: "demo-estetica-prueba-mpfvpl5u.arzac.studio", img: "/landing/og-estetica.png" },
  { id: "remod",    niche: "Painting & home",   city: "BUE",  url: "demo-pintureria-el-paolo-mpfwkvuh.arzac.studio", img: "/landing/og-pintureria.png" },
];
