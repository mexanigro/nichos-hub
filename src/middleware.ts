import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

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
  "/api/appointments/book",
  "/api/appointments/available",
  "/api/bookings",
  "/api/contract-leads",
  "/api/tenant-claim",
  "/api/sales-assistant",
  "/api/deploy",
  "/opengraph-image",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getOwnerEmails(): string[] {
  return (process.env.OWNER_EMAIL || "")
    .toLowerCase()
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token?.email || !getOwnerEmails().includes(token.email.toLowerCase())) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
