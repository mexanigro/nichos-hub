"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();
  const [draft, setDraft] = useState<BuilderDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBuilderDraft().then((d) => {
      setDraft(d);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (status === "authenticated" && draft && !submitting && !error) {
      submitProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, draft]);

  async function submitProject() {
    if (!draft) return;
    setSubmitting(true);
    setError("");

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

  if (loading) {
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

  if (status === "authenticated" || submitting) {
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
          onClick={() => signIn("google", { callbackUrl: "/onboarding/preview" })}
          className="mt-6 inline-flex items-center gap-3 rounded-full bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Iniciar sesión con Google
        </button>

        <p className="mt-3 text-xs text-gray-400">
          Solo necesitamos saber a quién entregársela
        </p>
      </div>
    </div>
  );
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
