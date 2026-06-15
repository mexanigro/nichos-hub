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
import { useEffect, useRef } from "react";
import Image from "next/image";
import { useReveal } from "@/hooks/use-scroll-reveal";

const DIR = "/mascot/hedgehog/processed";

type Variant = "hero" | "evergreen" | "manifesto" | "final" | "footer";

interface PoseConfig {
  src: string;
  w: number; // intrinsic width of the processed asset
  h: number; // intrinsic height
  alt: string;
}

const POSES: Record<Variant, PoseConfig> = {
  hero: { src: `${DIR}/04-curled-A.png`, w: 760, h: 827, alt: "" },
  evergreen: { src: `${DIR}/05-curled-A-deep.png`, w: 760, h: 827, alt: "" },
  manifesto: { src: `${DIR}/07-relaxed.png`, w: 760, h: 880, alt: "" },
  final: { src: `${DIR}/01-belly-flower.png`, w: 760, h: 888, alt: "" },
  footer: { src: `${DIR}/05-curled-A-deep.png`, w: 760, h: 827, alt: "" },
};

interface MascotProps {
  variant: Variant;
  /** Hero only: head/body leans subtly toward the cursor within the hero. */
  mouseFollow?: boolean;
  /** Reveal transition delay so the mascot enters after the section content. */
  delayMs?: number;
}

export function Mascot({ variant, mouseFollow = false, delayMs = 250 }: MascotProps) {
  const reveal = useReveal<HTMLDivElement>();
  const followRef = useRef<HTMLDivElement>(null);
  const pose = POSES[variant];

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
      <div ref={followRef} className="at-mascot-follow">
        <div className="at-mascot-float">
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
        </div>
      </div>
    </div>
  );
}
