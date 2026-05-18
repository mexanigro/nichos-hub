"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { useUserAuth } from "@/lib/user-auth-context";
import { UserMenu } from "./user-menu";
import { AuthModal } from "./auth-modal";
import { Logo } from "./logo";

interface HeaderProps {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export function Header({ theme, toggleTheme }: HeaderProps) {
  const { t } = useT();
  const { user, loading: authLoading } = useUserAuth();
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#features", label: t.nav.features },
    { href: "#pricing", label: t.nav.pricing },
    { href: "#how-it-works", label: t.nav.howItWorks },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      {/* Floating navbar container — transitions from transparent to glass pill */}
      <div
        className={`mx-auto transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          scrolled
            ? "mt-3 max-w-4xl rounded-2xl border border-[var(--l-glass-border)] bg-[var(--l-glass)] shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl"
            : "mt-0 max-w-7xl bg-transparent"
        }`}
      >
        <div
          className={`grid items-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            scrolled
              ? "h-14 grid-cols-[1fr_auto_1fr] px-5"
              : "h-[72px] grid-cols-[1fr_auto_1fr] px-6 lg:px-10"
          }`}
        >
          {/* Logo */}
          <a
            href="#"
            className="flex items-center transition-opacity duration-200 hover:opacity-80"
          >
            <Logo
              iconClass={`transition-all duration-500 ${scrolled ? "h-7 w-7" : "h-9 w-9"}`}
              textClass={`transition-all duration-500 ${scrolled ? "text-[0.85rem]" : "text-[1rem]"}`}
            />
          </a>

          {/* Desktop nav — pill-shaped link group with animated underlines */}
          <nav className="hidden items-center md:flex">
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
                  {/* Underline on hover — slides in from left */}
                  <span className="absolute inset-x-4 -bottom-0.5 h-[1.5px] origin-left scale-x-0 rounded-full bg-[var(--l-accent)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-x-100" />
                </a>
              ))}
            </div>
          </nav>

          {/* Right controls */}
          <div className="flex items-center justify-end gap-2.5">
            <ThemeToggle theme={theme} toggle={toggleTheme} />
            <LanguageSwitcher />
            {!authLoading && !user && (
              <button
                onClick={() => setAuthOpen(true)}
                className="hidden text-[0.84rem] font-medium text-[var(--l-text-3)] transition-colors duration-200 hover:text-[var(--l-text)] md:inline-block"
              >
                Iniciar sesión
              </button>
            )}
            {!authLoading && user && <UserMenu />}
            <a
              href="#builder"
              className="l-nav-cta hidden rounded-[var(--l-radius-pill)] bg-[var(--l-accent)] px-5 py-2 text-[0.84rem] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97] md:inline-block"
              style={{ fontFamily: "var(--l-display)" }}
            >
              {t.nav.getStarted}
            </a>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
