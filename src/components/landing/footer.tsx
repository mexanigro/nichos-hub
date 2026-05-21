"use client";

import { useT } from "@/lib/i18n";
import { Logo } from "./logo";

export function Footer() {
  const { t } = useT();

  return (
    <footer className="border-t border-[var(--l-border-subtle)] py-10">
      <div className="l-container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <a href="#" className="flex items-center">
            <Logo iconClass="h-8 w-8" textClass="text-[0.9rem]" />
          </a>
          <span className="text-[0.82rem] text-[var(--l-text-3)]">
            &copy; {new Date().getFullYear()} arzac.studio. {t.footer.rights}
          </span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-[0.82rem] text-[var(--l-text-3)] transition-colors duration-200 hover:text-[var(--l-text-2)]">
            {t.footer.privacy}
          </a>
          <a href="#" className="text-[0.82rem] text-[var(--l-text-3)] transition-colors duration-200 hover:text-[var(--l-text-2)]">
            {t.footer.terms}
          </a>
        </div>
      </div>
    </footer>
  );
}
