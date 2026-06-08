import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

const PUBLIC_PATHS = new Set(["/", "/login", "/privacy", "/terms"]);

const PUBLIC_PREFIXES = [
  "/onboarding",
  "/pago",
  "/mi-cuenta",
  "/api/auth",
  "/api/cardcom",
  "/api/onboarding",
  "/api/free",
  "/api/cron",
  "/api/appointments",
  "/api/bookings",
  "/api/contract-leads",
  "/api/tenant-claim",
  "/api/sales-assistant",
  "/api/deploy",
  "/api/payments/contract",
  "/opengraph-image",
];

const AGENT_AUTH_PREFIXES = ["/api/whatsapp-config/"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAgentRoute(pathname: string, req: NextRequest): boolean {
  if (!req.headers.get("x-agent-secret")) return false;
  return AGENT_AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getOwnerEmails(): string[] {
  return (process.env.OWNER_EMAIL || "")
    .toLowerCase()
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (isAgentRoute(pathname, req)) {
    return NextResponse.next();
  }

  const email = req.auth?.user?.email;

  if (!email || !getOwnerEmails().includes(email.toLowerCase())) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
