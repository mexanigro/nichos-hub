"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useUserAuth } from "@/lib/user-auth-context";
import { saveBuilderDataToLead } from "@/lib/user-auth";
import { AuthModal } from "@/components/landing/auth-modal";
import { loadBuilderDraft, clearBuilderDraft, type BuilderDraft } from "@/lib/builder-storage";
import { getTranslations, detectLocale } from "@/lib/i18n";
import { RTL_LOCALES } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const NICHE_COLORS: Record<string, { primary: string; accent: string; bg: string }> = {
  barberia: { primary: "#c8a97e", accent: "#e8d5b7", bg: "#1a1a2e" },
  estetica: { primary: "#c77dba", accent: "#e8b4e0", bg: "#2d1b4e" },
  tattoo: { primary: "#e74c3c", accent: "#f5a5a0", bg: "#1a1a1a" },
  nails: { primary: "#e091c0", accent: "#f0c4df", bg: "#3d1f3d" },
  cafeteria: { primary: "#8fbc5a", accent: "#c4e09b", bg: "#2d3a25" },
  remodelaciones: { primary: "#5a9fd4", accent: "#a3cde8", bg: "#1e293b" },
  otro: { primary: "#5bbfad", accent: "#a0ddd2", bg: "#1e3a5f" },
};

const NICHE_SERVICES: Record<string, string[]> = {
  barberia: ["Corte clásico", "Barba", "Fade", "Hot towel"],
  estetica: ["Facial", "Masaje", "Depilación", "Uñas"],
  tattoo: ["Tattoo", "Piercing", "Cover-up", "Diseño"],
  nails: ["Manicure", "Pedicure", "Gel", "Nail art"],
  cafeteria: ["Espresso", "Latte", "Pastelería", "Brunch"],
  remodelaciones: ["Cocina", "Baño", "Pisos", "Pintura"],
  otro: ["Servicio 1", "Servicio 2", "Servicio 3", "Servicio 4"],
};

export default function PreviewPage() {
  const { user, loading: authLoading } = useUserAuth();
  const [draft, setDraft] = useState<BuilderDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const submitGuard = useRef(false);

  const locale = useMemo<Locale>(() => {
    if (draft?.locale) return draft.locale as Locale;
    return detectLocale();
  }, [draft]);

  const t = useMemo(() => getTranslations(locale), [locale]);
  const isRTL = RTL_LOCALES.includes(locale);

  useEffect(() => {
    loadBuilderDraft().then((d) => {
      setDraft(d);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user && draft && !submitGuard.current && !error) {
      submitGuard.current = true;
      submitProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, draft]);

  async function submitProject() {
    if (!draft || !user) return;
    setSubmitting(true);
    setError("");

    try {
      await saveBuilderDataToLead(user.uid, {
        niche: draft.niche,
        customNiche: draft.customNiche,
        businessMode: draft.businessMode,
        businessName: draft.businessName,
        description: draft.description,
        whatsapp: draft.whatsapp,
        email: draft.email,
        address: draft.address,
        instagram: draft.instagram,
      });
    } catch {
      // Non-critical — continue with project creation
    }

    const formData = new FormData();
    formData.append("niche", draft.niche);
    formData.append("customNiche", draft.customNiche);
    formData.append("businessMode", draft.businessMode);
    formData.append("businessName", draft.businessName);
    formData.append("description", draft.description);
    formData.append("whatsapp", draft.whatsapp);
    formData.append("email", draft.email);
    formData.append("address", draft.address);
    formData.append("instagram", draft.instagram);
    formData.append("logoCreate", String(draft.logoCreate));
    formData.append("colors", draft.colors || "");
    formData.append("locale", draft.locale || locale);
    formData.append("userUid", user.uid);
    formData.append("userEmail", user.email || "");

    if (draft.logo) {
      const blob = await dataUrlToBlob(draft.logo.dataUrl);
      formData.append("logo", blob, draft.logo.name);
    }
    for (const photo of draft.photos) {
      const blob = await dataUrlToBlob(photo.dataUrl);
      formData.append("photos", blob, photo.name);
    }
    for (const photo of draft.staffPhotos) {
      const blob = await dataUrlToBlob(photo.dataUrl);
      formData.append("staffPhotos", blob, photo.name);
    }

    try {
      const res = await fetch("/api/onboarding", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Submission failed" }));
        setError(err.error || t.preview.error);
        return;
      }
      const { clientId } = await res.json();
      await clearBuilderDraft();
      window.location.href = `/onboarding/status/${clientId}`;
    } catch {
      setError(t.preview.error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fafafa] px-6" dir={isRTL ? "rtl" : "ltr"}>
        <p className="text-lg font-medium text-gray-800">{t.preview.noData}</p>
        <a
          href="/"
          className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          {t.preview.startOver}
        </a>
      </div>
    );
  }

  if (user || submitting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fafafa] px-6" dir={isRTL ? "rtl" : "ltr"}>
        {error ? (
          <>
            <p className="text-lg font-medium text-red-600">{error}</p>
            <button
              onClick={submitProject}
              className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              {t.preview.retry}
            </button>
          </>
        ) : (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
            <p className="text-sm text-gray-600">{t.preview.loading}</p>
          </>
        )}
      </div>
    );
  }

  const nicheKey = draft.niche || "otro";
  const colors = NICHE_COLORS[nicheKey] || NICHE_COLORS.otro;
  const services = NICHE_SERVICES[nicheKey] || NICHE_SERVICES.otro;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-6 py-12" dir={isRTL ? "rtl" : "ltr"}>
      <span className="mb-10 text-sm font-semibold tracking-wide text-gray-400">
        arzac.studio
      </span>

      {/* Niche-specific hero mockup */}
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-2xl shadow-2xl">
        <div
          className="relative w-full p-0"
          style={{ background: colors.bg }}
        >
          {/* Mini-template: Nav */}
          <div className="flex items-center justify-between px-5 py-3 blur-[4px]">
            <span
              className="text-[0.7rem] font-bold tracking-wide"
              style={{ color: colors.primary }}
            >
              {draft.businessName.toUpperCase().slice(0, 16)}
            </span>
            <div className="flex gap-3">
              <div className="h-2 w-8 rounded" style={{ background: `${colors.accent}30` }} />
              <div className="h-2 w-8 rounded" style={{ background: `${colors.accent}30` }} />
              <div className="h-2 w-8 rounded" style={{ background: `${colors.accent}30` }} />
            </div>
          </div>

          {/* Mini-template: Hero */}
          <div className="flex flex-col items-center px-6 pb-4 pt-8 blur-[4px]">
            <div
              className="mb-3 h-1 w-10 rounded-full"
              style={{ background: colors.primary }}
            />
            <div
              className="mb-2 h-6 w-3/4 rounded"
              style={{ background: `${colors.accent}35` }}
            />
            <div
              className="mb-4 h-3 w-2/3 rounded"
              style={{ background: `${colors.accent}20` }}
            />
            <div
              className="h-9 w-28 rounded-full"
              style={{ background: colors.primary }}
            />
          </div>

          {/* Mini-template: Service cards */}
          <div className="grid grid-cols-2 gap-2.5 px-5 pb-6 pt-2 blur-[4px]">
            {services.map((svc, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-lg p-3"
                style={{ background: `${colors.accent}10`, border: `1px solid ${colors.accent}15` }}
              >
                <div
                  className="mb-2 h-5 w-5 rounded-md"
                  style={{ background: `${colors.primary}40` }}
                />
                <span
                  className="text-[0.6rem] font-medium"
                  style={{ color: `${colors.accent}90` }}
                >
                  {svc}
                </span>
              </div>
            ))}
          </div>

          {/* Mini-template: Footer */}
          <div className="flex items-center justify-center gap-3 px-5 pb-4 blur-[4px]">
            <div className="h-2 w-14 rounded" style={{ background: `${colors.accent}15` }} />
            <div className="h-2 w-14 rounded" style={{ background: `${colors.accent}15` }} />
          </div>

          {/* Business name overlay — sharp, unblurred */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center">
              <span
                className="block text-2xl font-bold drop-shadow-lg"
                style={{ color: colors.accent }}
              >
                {draft.businessName}
              </span>
              <span
                className="mt-1 block text-xs font-medium tracking-widest uppercase"
                style={{ color: `${colors.accent}90` }}
              >
                {nicheKey !== "otro" ? nicheKey : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="mt-10 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          {t.preview.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {t.preview.subtitle}
        </p>

        <button
          onClick={() => setAuthOpen(true)}
          className="mt-6 inline-flex items-center gap-3 rounded-full bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          {t.preview.cta}
        </button>

        <p className="mt-3 text-xs text-gray-400">
          {t.preview.ctaSub}
        </p>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
