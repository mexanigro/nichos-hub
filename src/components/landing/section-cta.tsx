"use client";
/**
 * CTA contextual reutilizable al final de secciones clave, para que cada
 * sección tenga una llamada a la acción clara y "a mano" (pedido de Liam).
 * Reusa strings ya traducidos (nav.start, hero.cta) — no agrega claves i18n.
 */
import { useT } from "@/lib/i18n/context";

const WA_HREF = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "972557719141"}`;

export function SectionCta({ to = "pricing" }: { to?: "pricing" | "whatsapp" }) {
  const { t } = useT();
  const arrow = (
    <span style={{ fontFamily: "var(--at-serif)", fontStyle: "italic", fontSize: 18 }}>&rarr;</span>
  );

  if (to === "whatsapp") {
    return (
      <div className="at-section-cta">
        <a className="at-btn-primary" href={WA_HREF} target="_blank" rel="noopener noreferrer">
          {t.hero.cta} {arrow}
        </a>
        <a className="at-btn-link" href="#pricing">{t.nav.pricing}</a>
      </div>
    );
  }

  return (
    <div className="at-section-cta">
      <a className="at-btn-primary" href="#pricing">{t.nav.start} {arrow}</a>
      <a className="at-btn-link" href={WA_HREF} target="_blank" rel="noopener noreferrer">{t.hero.cta}</a>
    </div>
  );
}
