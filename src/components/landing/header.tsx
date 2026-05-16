"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const links = [
    { href: "#features", label: t.nav.features },
    { href: "#pricing", label: t.nav.pricing },
    { href: "#how-it-works", label: t.nav.howItWorks },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--l-border-subtle)] bg-white/92 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="l-container grid h-[72px] grid-cols-[1fr_auto_1fr] items-center">
        <a href="#" className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="Arzac Studio" className="h-9 w-9 rounded-md object-cover" />
          <span
            style={{ fontFamily: "var(--l-display)" }}
            className="hidden text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--l-text)] sm:inline"
          >
            arzac.studio
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[0.9rem] font-medium text-[var(--l-text-3)] transition-colors duration-200 hover:text-[var(--l-text)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <LanguageSwitcher />
          <a
            href="#builder"
            className="hidden rounded-[var(--l-radius-pill)] bg-[var(--l-accent)] px-6 py-2.5 text-[0.88rem] font-semibold text-white transition-all duration-200 hover:opacity-90 md:inline-block"
            style={{ fontFamily: "var(--l-display)" }}
          >
            {t.nav.getStarted}
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-[var(--l-text-2)] md:hidden"
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {menuOpen ? (
                <path d="M6 6l10 10M16 6L6 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M4 7h14M4 11h14M4 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-b border-[var(--l-border-subtle)] bg-white/95 px-6 pb-5 pt-1 backdrop-blur-xl md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-[0.95rem] text-[var(--l-text-2)] transition-colors hover:text-[var(--l-text)]"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#builder"
            onClick={() => setMenuOpen(false)}
            className="mt-3 block rounded-[var(--l-radius-pill)] bg-[var(--l-accent)] px-4 py-3 text-center text-[0.9rem] font-semibold text-white"
            style={{ fontFamily: "var(--l-display)" }}
          >
            {t.nav.getStarted}
          </a>
        </div>
      )}
    </header>
  );
}
