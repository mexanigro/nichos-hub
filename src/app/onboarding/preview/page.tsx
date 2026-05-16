"use client";

import { useEffect, useState, useRef } from "react";
import { useUserAuth } from "@/lib/user-auth-context";
import { saveBuilderDataToLead } from "@/lib/user-auth";
import { AuthModal } from "@/components/landing/auth-modal";
import { loadBuilderDraft, clearBuilderDraft, type BuilderDraft } from "@/lib/builder-storage";

const NICHE_COLORS: Record<string, { from: string; to: string }> = {
  barberia: { from: "#1a1a2e", to: "#16213e" },
  estetica: { from: "#2d1b4e", to: "#462255" },
  tattoo: { from: "#1a1a1a", to: "#2d2d2d" },
  nails: { from: "#3d1f3d", to: "#5c2d5c" },
  cafeteria: { from: "#2d3a25", to: "#1a2e1a" },
  remodelaciones: { from: "#1e293b", to: "#0f172a" },
  otro: { from: "#1e3a5f", to: "#2c5364" },
};

export default function PreviewPage() {
  const { user, loading: authLoading } = useUserAuth();
  const [draft, setDraft] = useState<BuilderDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const submitGuard = useRef(false);

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
    formData.append("colors", JSON.stringify(draft.colors));
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
        setError(err.error || "Algo salió mal");
        return;
      }
      const { clientId } = await res.json();
      await clearBuilderDraft();
      window.location.href = `/onboarding/status/${clientId}`;
    } catch {
      setError("Error de red. Intenta de nuevo.");
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fafafa] px-6">
        <p className="text-lg font-medium text-gray-800">No encontramos tus datos</p>
        <a
          href="/"
          className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Empezar de nuevo
        </a>
      </div>
    );
  }

  if (user || submitting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fafafa] px-6">
        {error ? (
          <>
            <p className="text-lg font-medium text-red-600">{error}</p>
            <button
              onClick={submitProject}
              className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Reintentar
            </button>
          </>
        ) : (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
            <p className="text-sm text-gray-600">Creando tu proyecto...</p>
          </>
        )}
      </div>
    );
  }

  const colors = NICHE_COLORS[draft.niche] || NICHE_COLORS.otro;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-6 py-12">
      <span className="mb-10 text-sm font-semibold tracking-wide text-gray-400">
        arzac.studio
      </span>

      {/* Blurred mockup */}
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-2xl shadow-2xl">
        <div
          className="relative aspect-[3/4] w-full p-6"
          style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
        >
          {/* Glass overlay */}
          <div className="absolute inset-0 backdrop-blur-[2px]" />

          {/* Skeleton content */}
          <div className="relative z-10 flex h-full flex-col gap-5 blur-[10px]">
            {/* Nav skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-white/20" />
              <div className="flex gap-3">
                <div className="h-3 w-12 rounded bg-white/15" />
                <div className="h-3 w-12 rounded bg-white/15" />
                <div className="h-3 w-12 rounded bg-white/15" />
              </div>
            </div>

            {/* Hero skeleton */}
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="h-8 w-3/4 rounded bg-white/25" />
              <div className="h-4 w-2/3 rounded bg-white/15" />
              <div className="mt-2 h-10 w-32 rounded-full bg-white/30" />
            </div>

            {/* Card grid skeleton */}
            <div className="mt-auto grid grid-cols-2 gap-3">
              <div className="aspect-square rounded-lg bg-white/10" />
              <div className="aspect-square rounded-lg bg-white/10" />
              <div className="aspect-square rounded-lg bg-white/10" />
              <div className="aspect-square rounded-lg bg-white/10" />
            </div>
          </div>

          {/* Business name overlay */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <span className="text-2xl font-bold text-white/80 drop-shadow-lg">
              {draft.businessName}
            </span>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="mt-10 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          Tu web para {draft.businessName} está lista
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Iniciá sesión para verla completa
        </p>

        <button
          onClick={() => setAuthOpen(true)}
          className="mt-6 inline-flex items-center gap-3 rounded-full bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Iniciar sesión
        </button>

        <p className="mt-3 text-xs text-gray-400">
          Con Google o email — solo toma unos segundos
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
