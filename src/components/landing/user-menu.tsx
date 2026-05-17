"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { signOut } from "@/lib/user-auth";
import { useUserAuth } from "@/lib/user-auth-context";

export function UserMenu() {
  const { user } = useUserAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the trigger button
    buttonRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key and keyboard navigation
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      // Arrow navigation within menu items
      const menu = menuRef.current;
      if (!menu) return;
      const items = menu.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (items.length === 0) return;

      const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[next].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prev].focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  // Focus first menu item when opening
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
        first?.focus();
      });
    }
  }, [open]);

  if (!user) return null;

  const initials = (user.displayName || user.email || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-label="Menú de usuario"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--l-accent)] text-[0.75rem] font-bold text-white transition-transform hover:scale-105"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Opciones de cuenta"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--l-border)] bg-[var(--l-card)] p-2 shadow-xl"
        >
          <div className="border-b border-[var(--l-border-subtle)] px-3 pb-2.5 pt-1.5">
            <p className="truncate text-[0.85rem] font-medium text-[var(--l-text)]">
              {user.displayName || "Usuario"}
            </p>
            <p className="truncate text-[0.78rem] text-[var(--l-text-3)]">{user.email}</p>
          </div>

          <a
            href="/mi-cuenta"
            role="menuitem"
            tabIndex={0}
            className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.85rem] text-[var(--l-text-2)] transition-colors hover:bg-[var(--l-surface)] focus:bg-[var(--l-surface)] focus:outline-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Mi cuenta
          </a>

          <button
            role="menuitem"
            tabIndex={0}
            onClick={async () => { await signOut(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.85rem] text-[var(--l-text-2)] transition-colors hover:bg-[var(--l-surface)] focus:bg-[var(--l-surface)] focus:outline-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
