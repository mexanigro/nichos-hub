"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { useUserAuth } from "@/lib/user-auth-context";
import { UserMenu } from "./user-menu";
import { AuthModal } from "./auth-modal";
import { Logo } from "./logo";

const WA_HREF = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "")}`;

interface HeaderProps {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export function Header({ theme, toggleTheme }: HeaderProps) {
  const { t } = useT();
  const { user, loading: authLoading } = useUserAuth();
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock body scroll when menu is open */
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const links = [
    { href: "#features", label: t.nav.features },
    { href: "#pricing", label: t.nav.pricing },
    { href: "#how-it-works", label: t.nav.howItWorks },
  ];

  function handleLinkClick() {
    setMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      {/* Floating navbar container */}
      <div
        className={`mx-auto transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          scrolled
            ? "mt-3 max-w-5xl rounded-2xl border border-[var(--l-glass-border)] bg-[var(--l-glass)] shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl"
            : "mt-0 max-w-7xl bg-transparent"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            scrolled ? "h-14 px-5" : "h-[72px] px-6 lg:px-10"
          }`}
        >
          {/* Logo */}
          <a
            href="#"
            className="flex shrink-0 items-center transition-opacity duration-200 hover:opacity-80"
          >
            <Logo
              iconClass={`transition-all duration-500 ${scrolled ? "h-7 w-7" : "h-9 w-9"}`}
              textClass={`transition-all duration-500 ${scrolled ? "text-[0.85rem]" : "text-[1rem]"}`}
            />
          </a>

          {/* Desktop nav — visible at lg+ */}
          <nav className="hidden items-center lg:flex">
            <div
              className={`flex items-center rounded-full transition-all duration-500 ${
                scrolled
                  ? "gap-1 bg-transparent px-0"
                  : "gap-1 border border-[var(--l-glass-border)] bg-[var(--l-glass)] px-1.5 py-1 backdrop-blur-md"
              }`}
            >
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group relative rounded-full px-4 py-1.5 text-[0.85rem] font-medium text-[var(--l-text-3)] transition-colors duration-200 hover:text-[var(--l-text)]"
                >
                  {link.label}
                  <span className="absolute inset-x-4 -bottom-0.5 h-[1.5px] origin-left scale-x-0 rounded-full bg-[var(--l-accent)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-x-100" />
                </a>
              ))}
            </div>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} toggle={toggleTheme} />
            <LanguageSwitcher />

            {/* Desktop only — sign in + CTA */}
            {!authLoading && !user && (
              <button
                onClick={() => setAuthOpen(true)}
                className="hidden text-[0.84rem] font-medium text-[var(--l-text-3)] transition-colors duration-200 hover:text-[var(--l-text)] lg:inline-block"
              >
                Iniciar sesión
              </button>
            )}
            {!authLoading && user && (
              <div className="hidden lg:block">
                <UserMenu />
              </div>
            )}
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-[var(--l-radius-pill)] bg-white px-5 py-2 text-[0.84rem] font-semibold text-[#0a0a0f] transition-all duration-200 hover:opacity-90 active:scale-[0.97] lg:inline-block"
              style={{ fontFamily: "var(--l-display)" }}
            >
              {t.nav.getStarted}
            </a>

            {/* Mobile hamburger — visible below lg */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--l-text)] transition-colors duration-200 hover:bg-[var(--l-accent-muted)] lg:hidden"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ clipPath: "circle(0% at calc(100% - 40px) 36px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 40px) 36px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 40px) 36px)" }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-50 flex flex-col bg-[var(--l-glass)] backdrop-blur-2xl"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            {/* Close button */}
            <div className="flex items-center justify-between px-6 pt-5">
              <Logo iconClass="h-8 w-8" textClass="text-[0.9rem]" />
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--l-text)] transition-colors duration-200 hover:bg-[var(--l-accent-muted)]"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-1 flex-col items-center justify-center gap-6">
              {links.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.1 + i * 0.06,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  style={{ fontFamily: "var(--l-display)" }}
                  className="text-[1.3rem] font-semibold text-[var(--l-text)] transition-opacity duration-200 hover:opacity-70"
                >
                  {link.label}
                </motion.a>
              ))}

              {/* Sign in — mobile */}
              {!authLoading && !user && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.28, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => { setMenuOpen(false); setAuthOpen(true); }}
                  className="text-[1rem] font-medium text-[var(--l-text-2)] transition-opacity duration-200 hover:opacity-70"
                >
                  Iniciar sesión
                </motion.button>
              )}
              {!authLoading && user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.28, ease: [0.23, 1, 0.32, 1] }}
                >
                  <UserMenu />
                </motion.div>
              )}
            </nav>

            {/* CTA at bottom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="px-6 pb-8"
              style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                style={{ fontFamily: "var(--l-display)" }}
                className="flex h-14 items-center justify-center rounded-[var(--l-radius-pill)] bg-white text-[1rem] font-semibold text-[#0a0a0f] transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              >
                {t.nav.getStarted}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
