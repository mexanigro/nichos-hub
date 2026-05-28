import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { getRecentFailureCount, getLastTestEmailAt } from "@/lib/email";

type Provider = "log" | "resend" | "disabled";
type DomainStatus = "verified" | "pending" | "not_added" | "unknown";

interface EmailHealth {
  provider: Provider;
  apiKeyConfigured: boolean;
  resendDomainStatus?: DomainStatus;
  resendDomain?: string;
  /** ISO timestamp del ultimo send de tag=test_* (in-memory; pierde estado al redeploy). */
  lastTestEmailAt?: string;
  /** Cantidad de fallos de Resend en las ultimas 24h (in-memory). */
  recentFailures: number;
  /** Error de la consulta a Resend si fallo (solo en caso de error). */
  resendError?: string;
}

interface CacheEntry {
  status: DomainStatus;
  error?: string;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: CacheEntry | null = null;

function extractDomainFromFrom(from: string | undefined): string | undefined {
  if (!from) return undefined;
  const m = from.match(/<[^>]*@([^>]+)>/) || from.match(/@([^\s>]+)/);
  return m?.[1]?.toLowerCase();
}

function bucketStatus(rawStatus?: string): DomainStatus {
  if (!rawStatus) return "unknown";
  if (rawStatus === "verified") return "verified";
  return "pending";
}

async function fetchResendDomainStatus(apiKey: string, domain: string): Promise<{ status: DomainStatus; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { status: "unknown", error: `http_${res.status}: ${text.slice(0, 200)}` };
    }
    const json = await res.json().catch(() => ({}));
    const list: Array<{ name?: string; status?: string }> = json.data || [];
    const match = list.find((d) => (d.name || "").toLowerCase() === domain.toLowerCase());
    if (!match) return { status: "not_added" };
    return { status: bucketStatus(match.status) };
  } catch (e) {
    return { status: "unknown", error: e instanceof Error ? e.message : "fetch_failed" };
  }
}

export const GET = withOwner(async () => {
  const provider = (process.env.EMAIL_PROVIDER || "log") as Provider;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Liam de Arzac Studio <hola@arzac.studio>";
  const resendDomain = extractDomainFromFrom(from);

  const health: EmailHealth = {
    provider,
    apiKeyConfigured: !!apiKey,
    resendDomain,
    recentFailures: getRecentFailureCount(),
  };

  const lastTest = getLastTestEmailAt();
  if (lastTest) health.lastTestEmailAt = lastTest;

  if (apiKey && resendDomain) {
    const now = Date.now();
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
      health.resendDomainStatus = cache.status;
      if (cache.error) health.resendError = cache.error;
    } else {
      const { status, error } = await fetchResendDomainStatus(apiKey, resendDomain);
      cache = { status, error, fetchedAt: now };
      health.resendDomainStatus = status;
      if (error) health.resendError = error;
    }
  } else if (!apiKey) {
    health.resendDomainStatus = "unknown";
  }

  return NextResponse.json(health);
});
