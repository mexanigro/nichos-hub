"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ExternalLink, AlertCircle, Sparkles } from "lucide-react";
import { getTranslations, detectLocale } from "@/lib/i18n";
import { RTL_LOCALES } from "@/lib/i18n";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "9720557719141";
const POLL_INTERVAL = 5000;
type Status = "building" | "ready" | "error" | "pending" | "pending_review";

export default function OnboardingStatusPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [status, setStatus] = useState<Status>("pending");
  const [domain, setDomain] = useState("");
  const [url, setUrl] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const locale = useMemo(() => detectLocale(), []);
  const t = useMemo(() => getTranslations(locale), [locale]);
  const isRTL = RTL_LOCALES.includes(locale);

  useEffect(() => {
    if (!clientId) return;

    const controller = new AbortController();
    abortRef.current = controller;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(`/api/onboarding/status/${clientId}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          if (data.domain) setDomain(data.domain);
          if (data.url) setUrl(data.url);
          // pending_review tambien para de pollear (espera accion manual de Liam)
          if (data.status === "ready" || data.status === "error" || data.status === "pending_review") return;
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
      timeoutId = setTimeout(poll, POLL_INTERVAL);
    };

    poll();
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [clientId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-md border border-border bg-bg-card p-8 text-center"
      >
        {status === "pending_review" ? (
          <>
            <CheckCircle2 size={40} className="mx-auto mb-4 text-success" />
            <h1 className="text-lg font-bold text-text">{t.status.reviewTitle}</h1>
            <p className="mt-2 text-sm text-text-secondary" style={{ lineHeight: 1.5 }}>
              {t.status.reviewBody}
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-accent-from to-accent-to px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Sparkles size={14} />
              {t.status.reviewWhatsapp}
            </a>
            <p className="mt-4 text-xs text-text-muted">{t.status.reviewMeanwhile}: <a href="/mi-cuenta" className="underline transition-colors hover:text-text">mi cuenta</a></p>
          </>
        ) : status === "pending" || status === "building" ? (
          <>
            <Loader2 size={40} className="mx-auto mb-4 animate-spin text-accent" />
            <h1 className="text-lg font-bold text-text">{t.status.building}</h1>
            <p className="mt-2 text-sm text-text-secondary">
              {t.status.buildingSub}
            </p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-from to-accent-to"
                initial={{ width: "5%" }}
                animate={{ width: status === "building" ? "75%" : "20%" }}
                transition={{ duration: 60, ease: "linear" }}
              />
            </div>
          </>
        ) : status === "ready" ? (
          <>
            <CheckCircle2 size={40} className="mx-auto mb-4 text-success" />
            <h1 className="text-lg font-bold text-text">{t.status.ready}</h1>
            <p className="mt-2 text-sm text-text-secondary">
              {t.status.readySub}{" "}
              <span className="font-medium text-text">{domain}</span>
            </p>
            <a
              href={url || `https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-accent-from to-accent-to px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t.status.viewSite}
              <ExternalLink size={14} />
            </a>
          </>
        ) : (
          <>
            <AlertCircle size={40} className="mx-auto mb-4 text-danger" />
            <h1 className="text-lg font-bold text-text">{t.status.error}</h1>
            <p className="mt-2 text-sm text-text-secondary">
              {t.status.errorSub}
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
            >
              {t.status.contact}
            </a>
          </>
        )}
      </motion.div>
    </div>
  );
}
