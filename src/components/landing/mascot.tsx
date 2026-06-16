"use client";
/**
 * Arzac Studio mascot — a plush hedgehog that "travels" down the landing page,
 * appearing as a warm companion in the hero and the emotional dark sections.
 *
 * Design contract (see MASCOT-PLACEMENT-ANALYSIS.md):
 * - Decorative only: aria-hidden + pointer-events:none. Never intercepts text/clicks.
 * - RTL-aware: horizontal anchoring uses logical props in CSS; pose is mirrored.
 * - prefers-reduced-motion: all idle/entrance motion freezes to a static frame
 *   (handled by the global reduced-motion block in globals.css + the reveal hook).
 * - LCP-safe: lazy-loaded, never `priority`; enters after the hero LCP via reveal delay.
 * - Layering: sits below the sticky header (z<30) and never in the WhatsApp FAB corner.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReveal } from "@/hooks/use-scroll-reveal";

const DIR = "/mascot/hedgehog/processed";

type Variant = "hero" | "evergreen" | "manifesto" | "final" | "footer" | "showcase" | "agent" | "crm";

interface PoseConfig {
  src: string;
  w: number; // intrinsic width of the processed asset
  h: number; // intrinsic height
  alt: string;
  /** Optional transparent WebM loop (real motion, e.g. a gentle blink/doze).
   *  Shown only after mount and when motion is allowed; `src` is the poster/fallback. */
  video?: string;
}

const POSES: Record<Variant, PoseConfig> = {
  hero: { src: `${DIR}/hero-doze-poster.png`, w: 760, h: 760, alt: "", video: `${DIR}/hero-doze.webm` },
  evergreen: { src: `${DIR}/05-curled-A-deep.png`, w: 760, h: 827, alt: "" },
  manifesto: { src: `${DIR}/07-relaxed.png`, w: 760, h: 880, alt: "", video: `${DIR}/07-doze.webm` },
  final: { src: `${DIR}/01-belly-flower.png`, w: 760, h: 888, alt: "", video: `${DIR}/01-doze.webm` },
  footer: { src: `${DIR}/05-curled-A-deep.png`, w: 760, h: 827, alt: "" },
  // Scattered cameos en posiciones variadas (no al pie de la sección).
  showcase: { src: `${DIR}/02-belly-A-green.png`, w: 685, h: 760, alt: "" },
  agent: { src: `${DIR}/06-cozy-green.png`, w: 653, h: 760, alt: "" },
  crm: { src: `${DIR}/03-belly-A-warm.png`, w: 673, h: 760, alt: "" },
};

interface MascotProps {
  variant: Variant;
  /** Hero only: head/body leans subtly toward the cursor within the hero. */
  mouseFollow?: boolean;
  /** Hero only: the mascot drifts up + fades as the hero scrolls out (parallax). */
  scrollParallax?: boolean;
  /** Scattered cameos: gentle scroll-reactive parallax (the hedgehog "travels"
   *  with the page) based on its own viewport position. Subtle, gutter-only. */
  drift?: boolean;
  /** Reveal transition delay so the mascot enters after the section content. */
  delayMs?: number;
}

export function Mascot({ variant, mouseFollow = false, scrollParallax = false, drift = false, delayMs = 250 }: MascotProps) {
  const reveal = useReveal<HTMLDivElement>();
  const followRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pose = POSES[variant];

  // Show the motion video only when motion is allowed AND the mascot is near the
  // viewport (SSR/first paint render the poster image → no hydration mismatch;
  // reduced-motion = static). Lazy activation avoids loading the below-the-fold
  // video assets on initial page load (perf): each ~200-450KB WebM only fetches
  // when its section is approached.
  const [useVideo, setUseVideo] = useState(false);
  useEffect(() => {
    if (!pose.video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = scrollRef.current;
    if (!el) { setUseVideo(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setUseVideo(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px 400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pose.video]);

  // Scroll-anchored parallax: as the hero scrolls out of view the mascot drifts
  // up and fades, reacting naturally to scroll. Own transform layer (no clash
  // with reveal/mouse/idle). Disabled under reduced-motion.
  useEffect(() => {
    if (!scrollParallax) return;
    const el = scrollRef.current;
    if (!el) return;
    const anchor = el.closest<HTMLElement>(".at-hero");
    if (!anchor) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = anchor.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -r.top / (r.height || 1))); // 0 in-view → 1 scrolled out
        if (p <= 0) { el.style.transform = ""; el.style.opacity = ""; return; }
        el.style.transform = `translate3d(0, ${(-p * 64).toFixed(1)}px, 0)`;
        el.style.opacity = String((1 - p * 0.9).toFixed(3));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [scrollParallax]);

  // Gentle scroll-reactive drift for scattered cameos: the hedgehog "travels"
  // with the page (subtle ±12px parallax based on its own viewport position),
  // adding depth/life. Own transform layer (scrollRef) so it composes with the
  // idle float/breathe without clashing. Disabled under reduced-motion.
  useEffect(() => {
    if (!drift) return;
    const el = scrollRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const center = r.top + r.height / 2;
        const p = Math.max(-1, Math.min(1, (vh / 2 - center) / (vh / 2))); // -1 below → 0 centered → 1 above
        el.style.transform = `translate3d(0, ${(p * 12).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [drift]);

  // Subtle cursor-follow: lerp a small translate + tilt toward the pointer.
  // Decorative, hero/desktop only, disabled for touch + reduced-motion.
  useEffect(() => {
    if (!mouseFollow) return;
    const el = followRef.current;
    if (!el) return;
    const hero = el.closest<HTMLElement>(".at-hero");
    if (!hero) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (mq.matches || !fine.matches) return;

    let raf = 0;
    let curX = 0, curY = 0, curR = 0;
    let tgtX = 0, tgtY = 0, tgtR = 0;
    let active = false;

    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1..1
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      tgtX = Math.max(-1, Math.min(1, nx)) * 10; // px
      tgtY = Math.max(-1, Math.min(1, ny)) * 6;
      tgtR = Math.max(-1, Math.min(1, nx)) * 4; // deg
      if (!active) { active = true; loop(); }
    };
    const onLeave = () => { tgtX = 0; tgtY = 0; tgtR = 0; };
    const loop = () => {
      curX += (tgtX - curX) * 0.1;
      curY += (tgtY - curY) * 0.1;
      curR += (tgtR - curR) * 0.1;
      el.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0) rotate(${curR.toFixed(2)}deg)`;
      if (Math.abs(tgtX - curX) > 0.05 || Math.abs(tgtY - curY) > 0.05 || Math.abs(tgtR - curR) > 0.05) {
        raf = requestAnimationFrame(loop);
      } else {
        active = false;
      }
    };

    hero.addEventListener("mousemove", onMove, { passive: true });
    hero.addEventListener("mouseleave", onLeave, { passive: true });
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [mouseFollow]);

  return (
    <div
      ref={reveal}
      className={`at-mascot at-mascot--${variant}`}
      data-reveal
      data-mascot={variant}
      aria-hidden="true"
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      <div ref={scrollRef} className="at-mascot-scroll">
      <div ref={followRef} className="at-mascot-follow">
        <div className="at-mascot-float">
          {useVideo && pose.video ? (
            <video
              className="at-mascot-img"
              width={pose.w}
              height={pose.h}
              poster={pose.src}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            >
              <source src={pose.video} type="video/webm" />
            </video>
          ) : (
            <Image
              className="at-mascot-img"
              src={pose.src}
              width={pose.w}
              height={pose.h}
              alt={pose.alt}
              loading="lazy"
              draggable={false}
              sizes="(max-width: 1024px) 120px, 200px"
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
