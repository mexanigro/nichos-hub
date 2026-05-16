"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
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
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/50 bg-bg/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="#" className="text-sm font-semibold tracking-tight text-text">
          arzac<span className="text-accent">.</span>studio
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-text-secondary transition-colors hover:text-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <a
            href="#builder"
            className="hidden rounded-md bg-gradient-to-r from-accent-from to-accent-to px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 md:inline-block"
          >
            {t.nav.getStarted}
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover md:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-border bg-bg/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-1 px-5 py-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#builder"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-md bg-gradient-to-r from-accent-from to-accent-to px-4 py-2 text-center text-sm font-semibold text-white"
            >
              {t.nav.getStarted}
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
