"use client";

import { useT } from "@/lib/i18n";

export function Footer() {
  const { t } = useT();

  return (
    <footer className="border-t border-border px-5 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} arzac.studio. {t.footer.rights}
        </span>
        <div className="flex gap-5">
          <a href="#" className="text-[11px] text-text-muted transition-colors hover:text-text-secondary">
            {t.footer.privacy}
          </a>
          <a href="#" className="text-[11px] text-text-muted transition-colors hover:text-text-secondary">
            {t.footer.terms}
          </a>
        </div>
      </div>
    </footer>
  );
}
