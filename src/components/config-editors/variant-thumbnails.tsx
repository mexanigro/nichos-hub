"use client";

/**
 * CSS-only thumbnails for each section variant in the 3D Impact system.
 *
 * Each thumbnail is ~64px tall and tries to convey the *shape* of the layout,
 * not a faithful render — the goal is "can Liam tell the variants apart at
 * a glance" while choosing in the editor.
 */

import type { VariantSpec } from "./section-variant-selector";

/* ── Hero ───────────────────────────────────────────────────────────── */

function HeroStandardThumb() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2">
      <div className="h-1.5 w-3/4 rounded-sm bg-text-muted/40" />
      <div className="h-1 w-1/2 rounded-sm bg-text-muted/25" />
      <div className="mt-1.5 h-3 w-12 rounded-sm bg-accent/60" />
    </div>
  );
}
function HeroSliderThumb() {
  return (
    <div className="flex h-full w-full items-center justify-between gap-1 px-2">
      <div className="h-1 w-1 rounded-full bg-accent/40" />
      <div className="flex h-full flex-1 items-center justify-center bg-gradient-to-r from-transparent via-accent/15 to-transparent">
        <div className="h-2 w-1/2 rounded-sm bg-text-muted/30" />
      </div>
      <div className="h-1 w-1 rounded-full bg-accent/40" />
    </div>
  );
}
function Hero3DObjectThumb() {
  return (
    <div className="grid h-full w-full grid-cols-[3fr_2fr] gap-1 p-1.5">
      <div className="flex flex-col justify-center gap-1">
        <div className="h-1.5 w-full rounded-sm bg-text-muted/40" />
        <div className="h-1 w-3/4 rounded-sm bg-text-muted/25" />
        <div className="mt-0.5 h-2 w-8 rounded-sm bg-accent/60" />
      </div>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-md bg-[radial-gradient(circle,_rgba(255,255,255,0.05),_transparent_60%)]" />
        <div className="relative h-7 w-7 rounded-sm bg-gradient-to-br from-accent/80 to-accent/30 shadow-[0_4px_8px] shadow-accent/40" />
      </div>
    </div>
  );
}

export const HERO_VARIANTS: readonly VariantSpec<
  "standard" | "slider" | "hero-3d-object"
>[] = [
  {
    value: "standard",
    name: "Standard",
    desc: "Texto centrado + CTA + imagen de fondo (clasico).",
    technicalName: "hero-standard",
    Thumbnail: HeroStandardThumb,
  },
  {
    value: "slider",
    name: "Slider",
    desc: "Galeria horizontal con paginacion.",
    technicalName: "hero-slider",
    Thumbnail: HeroSliderThumb,
  },
  {
    value: "hero-3d-object",
    name: "Hero 3D Object",
    desc: "2 columnas: texto izquierda, objeto 3D parallax derecha.",
    badge: "3D",
    technicalName: "hero-3d-object",
    requiresHeroObjects: true,
    Thumbnail: Hero3DObjectThumb,
  },
] as const;

/* ── WhyChooseUs ────────────────────────────────────────────────────── */

function WhyChooseStandardThumb() {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-1.5 p-1.5">
      <div className="rounded bg-text-muted/15" />
      <div className="flex flex-col justify-center gap-1">
        <div className="h-1 w-full rounded-sm bg-text-muted/40" />
        <div className="h-1 w-3/4 rounded-sm bg-text-muted/25" />
        <div className="h-1 w-1/2 rounded-sm bg-text-muted/25" />
      </div>
    </div>
  );
}
function WhyChooseIconGrid3DThumb() {
  return (
    <div className="grid h-full w-full grid-cols-3 gap-1 p-1.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center justify-center rounded bg-bg-card/70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.12), transparent 70%)",
          }}
        >
          <div className="h-2 w-2 rounded-sm bg-accent/60 shadow-[0_2px_4px] shadow-accent/40" />
        </div>
      ))}
    </div>
  );
}

export const WHY_CHOOSE_VARIANTS: readonly VariantSpec<
  "standard" | "icon-grid-3d"
>[] = [
  {
    value: "standard",
    name: "Standard",
    desc: "Imagen + lista de beneficios (clasico).",
    technicalName: "why-choose-standard",
    Thumbnail: WhyChooseStandardThumb,
  },
  {
    value: "icon-grid-3d",
    name: "Icon Grid 3D",
    desc: "Grilla de cards con iconos 3D y profundidad.",
    badge: "3D",
    technicalName: "why-choose-icon-grid-3d",
    Thumbnail: WhyChooseIconGrid3DThumb,
  },
] as const;

/* ── Services ───────────────────────────────────────────────────────── */

function ServicesStandardThumb() {
  return (
    <div className="grid h-full w-full grid-cols-3 gap-1 p-1.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col items-center justify-center rounded bg-bg-card/70 p-1">
          <div className="h-1.5 w-1.5 rounded-full bg-accent/60" />
          <div className="mt-1 h-1 w-3/4 rounded-sm bg-text-muted/40" />
        </div>
      ))}
    </div>
  );
}
function ServicesListWithIconsThumb() {
  return (
    <div className="flex h-full w-full flex-col gap-1 p-1.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-1.5 rounded bg-bg-card/60 p-1">
          <div className="h-2 w-2 rounded-sm bg-accent/60" />
          <div className="h-1 flex-1 rounded-sm bg-text-muted/30" />
          <div className="h-1 w-4 rounded-sm bg-text-muted/40" />
        </div>
      ))}
    </div>
  );
}
function ServicesTreatmentCardGridThumb() {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-1 p-1.5">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded bg-gradient-to-br from-accent/15 to-bg-card/80"
        >
          <div className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white/60" />
          <div className="absolute bottom-1 left-1 right-1 h-1 rounded-sm bg-white/40" />
        </div>
      ))}
    </div>
  );
}
function ServicesCardStackTabsThumb() {
  return (
    <div className="flex h-full w-full flex-col gap-0.5 p-1.5">
      <div className="flex gap-1">
        <div className="h-1 w-6 rounded-sm bg-accent/60" />
        <div className="h-1 w-6 rounded-sm bg-text-muted/30" />
        <div className="h-1 w-6 rounded-sm bg-text-muted/30" />
      </div>
      <div className="relative mt-1 flex-1">
        <div className="absolute inset-0 translate-x-1.5 translate-y-1 rounded bg-bg-card/50" />
        <div className="absolute inset-0 translate-x-1 translate-y-0.5 rounded bg-bg-card/70" />
        <div className="absolute inset-0 rounded bg-gradient-to-br from-accent/30 to-bg-card" />
      </div>
    </div>
  );
}

export const SERVICES_VARIANTS: readonly VariantSpec<
  "standard" | "list-with-icons" | "treatment-card-grid" | "card-stack-tabs"
>[] = [
  {
    value: "standard",
    name: "Standard",
    desc: "Grid 3 columnas con titulo + precio.",
    technicalName: "services-standard",
    Thumbnail: ServicesStandardThumb,
  },
  {
    value: "list-with-icons",
    name: "List with Icons",
    desc: "Lista vertical con icono + nombre + precio en cada fila.",
    technicalName: "services-list-with-icons",
    Thumbnail: ServicesListWithIconsThumb,
  },
  {
    value: "treatment-card-grid",
    name: "Treatment Card Grid",
    desc: "Grid 2 columnas con cards visuales tipo tratamiento.",
    technicalName: "services-treatment-card-grid",
    Thumbnail: ServicesTreatmentCardGridThumb,
  },
  {
    value: "card-stack-tabs",
    name: "Card Stack + Tabs",
    desc: "Tabs por categoria con stack de cards animado.",
    badge: "3D",
    technicalName: "services-card-stack-tabs",
    Thumbnail: ServicesCardStackTabsThumb,
  },
] as const;

/* ── Gallery ────────────────────────────────────────────────────────── */

function GalleryStandardThumb() {
  return (
    <div className="grid h-full w-full grid-cols-3 gap-1 p-1.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded bg-gradient-to-br from-bg-card/80 to-text-muted/15" />
      ))}
    </div>
  );
}
function GalleryBentoStatsThumb() {
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-1 p-1.5">
      <div className="col-span-2 row-span-2 rounded bg-gradient-to-br from-bg-card/80 to-text-muted/15" />
      <div className="flex items-center justify-center rounded bg-accent/20">
        <div className="h-1 w-3 rounded-sm bg-accent/60" />
      </div>
      <div className="rounded bg-text-muted/15" />
    </div>
  );
}
function GalleryGridWithFiltersThumb() {
  return (
    <div className="flex h-full w-full flex-col gap-1 p-1.5">
      <div className="flex gap-1">
        <div className="h-1 w-4 rounded-full bg-accent/60" />
        <div className="h-1 w-4 rounded-full bg-text-muted/30" />
        <div className="h-1 w-4 rounded-full bg-text-muted/30" />
      </div>
      <div className="grid flex-1 grid-cols-4 gap-0.5">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="rounded-sm bg-text-muted/15" />
        ))}
      </div>
    </div>
  );
}
function GalleryPortraitBentoCameoThumb() {
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-1 p-1.5">
      <div className="row-span-2 rounded bg-gradient-to-b from-accent/15 to-bg-card/80" />
      <div className="rounded bg-text-muted/15" />
      <div className="relative row-span-2 rounded bg-bg-card/70">
        <div
          className="absolute inset-0 m-1 rounded-sm bg-gradient-to-br from-accent/60 to-accent/20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.20), transparent 70%)",
          }}
        />
      </div>
      <div className="rounded bg-text-muted/15" />
    </div>
  );
}

export const GALLERY_VARIANTS: readonly VariantSpec<
  "standard" | "bento-stats" | "grid-with-filters" | "portrait-bento-3d-cameo"
>[] = [
  {
    value: "standard",
    name: "Standard",
    desc: "Grid 3 columnas clasico, sin filtros.",
    technicalName: "gallery-standard",
    Thumbnail: GalleryStandardThumb,
  },
  {
    value: "bento-stats",
    name: "Bento Stats",
    desc: "Layout bento con stats highlighted en celdas.",
    technicalName: "gallery-bento-stats",
    Thumbnail: GalleryBentoStatsThumb,
  },
  {
    value: "grid-with-filters",
    name: "Grid with Filters",
    desc: "Grid con pills de filtro arriba, items taggeados.",
    technicalName: "gallery-grid-with-filters",
    Thumbnail: GalleryGridWithFiltersThumb,
  },
  {
    value: "portrait-bento-3d-cameo",
    name: "Portrait Bento 3D Cameo",
    desc: "Bento vertical con celda destacada que muestra objeto 3D.",
    badge: "3D",
    technicalName: "gallery-portrait-bento-3d-cameo",
    requiresHeroObjects: true,
    Thumbnail: GalleryPortraitBentoCameoThumb,
  },
] as const;

/* ── Booking ────────────────────────────────────────────────────────── */

function BookingStandardThumb() {
  return (
    <div className="flex h-full w-full flex-col gap-1 p-1.5">
      <div className="h-1.5 rounded bg-text-muted/30" />
      <div className="h-1.5 rounded bg-text-muted/30" />
      <div className="h-1.5 rounded bg-text-muted/30" />
      <div className="mt-auto h-2 w-12 rounded bg-accent/60" />
    </div>
  );
}
function BookingFormMapHours3DThumb() {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-1 p-1.5">
      <div className="flex flex-col gap-0.5">
        <div className="h-1 rounded bg-text-muted/30" />
        <div className="h-1 rounded bg-text-muted/30" />
        <div className="mt-auto h-1.5 w-8 rounded bg-accent/60" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex-1 rounded bg-gradient-to-br from-emerald-500/15 to-blue-500/10" />
        <div className="grid grid-cols-7 gap-px">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-1 rounded-sm bg-text-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}

export const BOOKING_VARIANTS: readonly VariantSpec<"standard" | "form-map-hours-3d">[] = [
  {
    value: "standard",
    name: "Standard",
    desc: "Form 1 columna, tradicional.",
    technicalName: "booking-standard",
    Thumbnail: BookingStandardThumb,
  },
  {
    value: "form-map-hours-3d",
    name: "Form + Map + Hours 3D",
    desc: "Form izquierda, mapa + horarios derecha, todo con depth.",
    badge: "3D",
    technicalName: "booking-form-map-hours-3d",
    Thumbnail: BookingFormMapHours3DThumb,
  },
] as const;
