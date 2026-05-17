"use client";

import { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithGoogle, signInWithEmail, registerWithEmail } from "@/lib/user-auth";
import { useT } from "@/lib/i18n";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ open, onClose, onSuccess, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { t } = useT();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const uid = useId();

  // Save focus on open, restore on close
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Small delay so the dialog renders before we try to focus
      requestAnimationFrame(() => {
        dialogRef.current?.focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    function trapFocus(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function reset() {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleGoogle() {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      onSuccess?.();
      handleClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t.auth.errorGeneric;
      if (!msg.includes("popup-closed")) setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (tab === "login") {
        await signInWithEmail(email, password);
      } else {
        if (!name.trim()) {
          setError(t.auth.errorNameRequired);
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, name.trim());
      }
      onSuccess?.();
      handleClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError(t.auth.errorWrongPassword);
      } else if (msg.includes("email-already-in-use")) {
        setError(t.auth.errorEmailExists);
      } else if (msg.includes("weak-password")) {
        setError(t.auth.errorWeakPassword);
      } else if (msg.includes("invalid-email")) {
        setError(t.auth.errorInvalidEmail);
      } else if (msg.includes("user-not-found")) {
        setError(t.auth.errorUserNotFound);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const titleId = `${uid}-title`;
  const nameId = `${uid}-name`;
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[400px] rounded-2xl border border-[var(--l-border)] bg-[var(--l-card)] p-7 shadow-2xl outline-none"
          >
            <h2 id={titleId} className="sr-only">
              {tab === "login" ? t.auth.login : t.auth.register}
            </h2>

            <button
              onClick={handleClose}
              aria-label={t.auth.close}
              className="absolute right-4 top-4 p-1 text-[var(--l-text-3)] transition-colors hover:text-[var(--l-text-2)]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            {/* Tabs */}
            <div className="mb-6 flex gap-1 rounded-xl bg-[var(--l-surface)] p-1" role="tablist">
              <button
                role="tab"
                aria-selected={tab === "login"}
                onClick={() => { setTab("login"); setError(""); }}
                className={`flex-1 rounded-lg py-2.5 text-[0.85rem] font-semibold transition-all ${
                  tab === "login"
                    ? "bg-[var(--l-card)] text-[var(--l-text)] shadow-sm"
                    : "text-[var(--l-text-3)] hover:text-[var(--l-text-2)]"
                }`}
              >
                {t.auth.login}
              </button>
              <button
                role="tab"
                aria-selected={tab === "register"}
                onClick={() => { setTab("register"); setError(""); }}
                className={`flex-1 rounded-lg py-2.5 text-[0.85rem] font-semibold transition-all ${
                  tab === "register"
                    ? "bg-[var(--l-card)] text-[var(--l-text)] shadow-sm"
                    : "text-[var(--l-text-3)] hover:text-[var(--l-text-2)]"
                }`}
              >
                {t.auth.register}
              </button>
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--l-border)] bg-[var(--l-surface)] px-4 py-3 text-[0.88rem] font-medium text-[var(--l-text)] transition-all hover:border-[var(--l-border-subtle)] hover:shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t.auth.googleButton}
            </button>

            <div className="my-5 flex items-center gap-3" aria-hidden="true">
              <div className="h-px flex-1 bg-[var(--l-border)]" />
              <span className="text-xs text-[var(--l-text-3)]">{t.auth.orEmail}</span>
              <div className="h-px flex-1 bg-[var(--l-border)]" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
              {tab === "register" && (
                <div className="flex flex-col gap-1">
                  <label htmlFor={nameId} className="text-[0.78rem] font-medium text-[var(--l-text-2)]">
                    {t.auth.name}
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border border-[var(--l-border)] bg-[var(--l-surface)] px-4 py-3 text-[0.88rem] text-[var(--l-text)] outline-none transition-all placeholder:text-[var(--l-text-3)] focus:border-[var(--l-accent)] focus:ring-2 focus:ring-[var(--l-accent)]/10"
                    placeholder={t.auth.namePlaceholder}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label htmlFor={emailId} className="text-[0.78rem] font-medium text-[var(--l-text-2)]">
                  {t.auth.email}
                </label>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border border-[var(--l-border)] bg-[var(--l-surface)] px-4 py-3 text-[0.88rem] text-[var(--l-text)] outline-none transition-all placeholder:text-[var(--l-text-3)] focus:border-[var(--l-accent)] focus:ring-2 focus:ring-[var(--l-accent)]/10"
                  placeholder={t.auth.emailPlaceholder}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={passwordId} className="text-[0.78rem] font-medium text-[var(--l-text-2)]">
                  {t.auth.password}
                </label>
                <input
                  id={passwordId}
                  type="password"
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="rounded-xl border border-[var(--l-border)] bg-[var(--l-surface)] px-4 py-3 text-[0.88rem] text-[var(--l-text)] outline-none transition-all placeholder:text-[var(--l-text-3)] focus:border-[var(--l-accent)] focus:ring-2 focus:ring-[var(--l-accent)]/10"
                  placeholder={t.auth.passwordPlaceholder}
                />
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-[0.82rem] text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded-xl bg-[var(--l-accent)] px-4 py-3 text-[0.88rem] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
                style={{ fontFamily: "var(--l-display)" }}
              >
                {loading
                  ? t.auth.processing
                  : tab === "login"
                    ? t.auth.submitLogin
                    : t.auth.submitRegister}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
