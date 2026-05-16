"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "9720557719141";
const POLL_INTERVAL = 5000;

export default function OnboardingStatusPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [status, setStatus] = useState<"building" | "ready" | "error" | "pending">("pending");
  const [domain, setDomain] = useState("");
  const [url, setUrl] = useState("");
  const abortRef = useRef<AbortController | null>(null);

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
          if (data.status === "ready" || data.status === "error") return;
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
    <div className="flex min-h-screen items-center justify-center bg-bg px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-md border border-border bg-bg-card p-8 text-center"
      >
        {status === "pending" || status === "building" ? (
          <>
            <Loader2 size={40} className="mx-auto mb-4 animate-spin text-accent" />
            <h1 className="text-lg font-bold text-text">Building your website...</h1>
            <p className="mt-2 text-sm text-text-secondary">
              This usually takes 2-3 minutes. Don&apos;t close this page.
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
            <h1 className="text-lg font-bold text-text">Your website is ready!</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Your site is live at{" "}
              <span className="font-medium text-text">{domain}</span>
            </p>
            <a
              href={url || `https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-accent-from to-accent-to px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              View my website
              <ExternalLink size={14} />
            </a>
          </>
        ) : (
          <>
            <AlertCircle size={40} className="mx-auto mb-4 text-danger" />
            <h1 className="text-lg font-bold text-text">Something went wrong</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Don&apos;t worry — our team has been notified and will fix this shortly.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
            >
              Contact us on WhatsApp
            </a>
          </>
        )}
      </motion.div>
    </div>
  );
}
