"use client";

/**
 * Tiny CSS-only preview for each splash variant.
 * Plays on parent's :hover via `group-hover:*` utilities — no JS animation
 * library. Each preview is ~32px tall and tries to capture the *flavor* of
 * the actual SplashScreen variant from the master-template, not pixel-perfect.
 *
 * Variants are documented in template src/components/layout/SplashScreen.tsx:
 *   1 Classic     — logo + staggered letters + accent line.
 *   2 Curtain     — split panels open to reveal brand.
 *   3 Pulse       — radial burst + logo materialization.
 *   4 Typewriter  — character-by-character typing.
 *   5 Vortex      — orbital particles converge.
 *   6 Cafeteria   — warm mocha, two-line serif title.
 *   7 Remodelaciones — bold wipe reveal.
 *
 * 3D Impact additions (Block 1-7.5 of master-template):
 *   "impact-scale"    — N bands collapse/scale around the hero object.
 *   "impact-split"    — vertical/horizontal split that reveals the brand.
 *   "impact-reveal-3d"— premium 3D reveal with ambient particles.
 */

export type SplashVariantId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | "impact-scale"
  | "impact-split"
  | "impact-reveal-3d";

export function SplashVariantPreview({ variant }: { variant: SplashVariantId }) {
  return (
    <div
      aria-hidden
      className="relative ml-8 mt-1 flex h-8 w-full max-w-[180px] items-center justify-center overflow-hidden rounded border border-border bg-bg-active/50"
    >
      {variant === 1 && <ClassicPreview />}
      {variant === 2 && <CurtainPreview />}
      {variant === 3 && <PulsePreview />}
      {variant === 4 && <TypewriterPreview />}
      {variant === 5 && <VortexPreview />}
      {variant === 6 && <CafeteriaPreview />}
      {variant === 7 && <RemodelacionesPreview />}
      {variant === "impact-scale" && <ImpactScalePreview />}
      {variant === "impact-split" && <ImpactSplitPreview />}
      {variant === "impact-reveal-3d" && <ImpactReveal3DPreview />}
    </div>
  );
}

function ClassicPreview() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="h-2 w-2 rounded-full bg-accent/60 transition-all duration-500 group-hover/splash:h-3 group-hover/splash:w-12 group-hover/splash:rounded-sm" />
    </div>
  );
}

function CurtainPreview() {
  return (
    <>
      <div className="absolute inset-y-0 left-0 w-1/2 origin-left bg-bg-active transition-transform duration-500 group-hover/splash:-translate-x-full" />
      <div className="absolute inset-y-0 right-0 w-1/2 origin-right bg-bg-active transition-transform duration-500 group-hover/splash:translate-x-full" />
      <span className="z-10 text-[10px] font-semibold text-accent opacity-0 transition-opacity delay-200 duration-300 group-hover/splash:opacity-100">
        MARCA
      </span>
    </>
  );
}

function PulsePreview() {
  return (
    <>
      <div className="absolute h-3 w-3 rounded-full bg-accent/50 transition-all duration-700 group-hover/splash:h-16 group-hover/splash:w-16 group-hover/splash:bg-accent/0" />
      <div className="z-10 h-2 w-2 rounded-full bg-accent" />
    </>
  );
}

function TypewriterPreview() {
  return (
    <div className="flex items-center gap-1">
      <span className="block h-1 w-1 rounded-full bg-text-muted transition-colors duration-200 group-hover/splash:bg-accent" />
      <span className="block h-1 w-1 rounded-full bg-text-muted transition-colors delay-100 duration-200 group-hover/splash:bg-accent" />
      <span className="block h-1 w-1 rounded-full bg-text-muted transition-colors delay-200 duration-200 group-hover/splash:bg-accent" />
      <span className="block h-3 w-px bg-accent opacity-0 transition-opacity delay-300 duration-200 group-hover/splash:animate-pulse group-hover/splash:opacity-100" />
    </div>
  );
}

function VortexPreview() {
  return (
    <>
      <div className="absolute h-6 w-6 rounded-full border border-accent/30 transition-transform duration-700 group-hover/splash:rotate-[270deg] group-hover/splash:scale-50">
        <span className="absolute -top-0.5 left-1/2 block h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
        <span className="absolute -bottom-0.5 left-1/2 block h-1 w-1 -translate-x-1/2 rounded-full bg-accent/70" />
      </div>
      <div className="z-10 h-1.5 w-1.5 rounded-full bg-accent" />
    </>
  );
}

function CafeteriaPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-900/40 to-amber-700/20">
      <div className="text-center">
        <p className="font-serif text-[9px] leading-tight text-amber-200 transition-all duration-500 group-hover/splash:tracking-wider">
          la
        </p>
        <p className="-mt-0.5 font-serif text-[11px] font-semibold leading-tight text-amber-100">
          casa
        </p>
      </div>
    </div>
  );
}

function RemodelacionesPreview() {
  return (
    <>
      <div className="absolute inset-y-0 left-0 w-full origin-left bg-accent/60 transition-transform duration-500 group-hover/splash:scale-x-0" />
      <span className="z-10 text-[10px] font-bold uppercase tracking-wider text-text opacity-0 transition-opacity delay-300 duration-200 group-hover/splash:opacity-100">
        BUILD
      </span>
    </>
  );
}

/* ── 3D Impact previews ────────────────────────────────────────────────── */

function ImpactScalePreview() {
  // 5 vertical bands that collapse to the center on hover.
  return (
    <div className="relative flex h-full w-full items-center justify-center gap-px">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="block h-full flex-1 bg-accent/35 transition-all duration-500"
          style={{
            transformOrigin: i < 2 ? "left" : i > 2 ? "right" : "center",
          }}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity delay-200 duration-300 group-hover/splash:opacity-100">
        <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px] shadow-accent/70" />
      </div>
      <style>{`
        .group\\/splash:hover .impact-scale-band-0 { transform: scaleX(0.1); }
      `}</style>
    </div>
  );
}

function ImpactSplitPreview() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 h-1/2 origin-top bg-bg-active transition-transform duration-500 group-hover/splash:-translate-y-full" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 origin-bottom bg-bg-active transition-transform duration-500 group-hover/splash:translate-y-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-4 w-4 rounded-full bg-accent/70 shadow-[0_0_10px] shadow-accent/60 transition-transform duration-500 group-hover/splash:scale-110" />
      </div>
    </>
  );
}

function ImpactReveal3DPreview() {
  // Premium look: gradient backdrop + rotating square + sparkle particles.
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06),_transparent_60%)]">
      <div className="relative h-5 w-5 transition-transform duration-700 group-hover/splash:rotate-[20deg] group-hover/splash:scale-110">
        <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-accent/80 to-accent/30 shadow-[0_4px_12px] shadow-accent/40" />
        <div className="absolute inset-0 rounded-sm border border-white/30" />
      </div>
      {/* sparkles */}
      <span className="absolute left-3 top-2 block h-1 w-1 rounded-full bg-white/70 opacity-0 transition-opacity delay-100 duration-300 group-hover/splash:opacity-100" />
      <span className="absolute right-3 top-3 block h-0.5 w-0.5 rounded-full bg-white/80 opacity-0 transition-opacity delay-200 duration-300 group-hover/splash:opacity-100" />
      <span className="absolute bottom-2 left-4 block h-0.5 w-0.5 rounded-full bg-white/60 opacity-0 transition-opacity delay-300 duration-300 group-hover/splash:opacity-100" />
      <span className="absolute bottom-3 right-4 block h-1 w-1 rounded-full bg-white/50 opacity-0 transition-opacity delay-150 duration-300 group-hover/splash:opacity-100" />
    </div>
  );
}
