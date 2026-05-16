"use client";

import { useT } from "@/lib/i18n";

export function Footer() {
  const { t } = useT();

  return (
    <footer className="border-t border-[var(--l-border-subtle)] py-10">
      <div className="l-container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span
            style={{ fontFamily: "var(--l-display)" }}
            className="text-[0.95rem] font-semibold text-[var(--l-text)]"
          >
            arzac.studio
          </span>
          <span className="text-[0.8rem] text-[var(--l-text-3)]">
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
