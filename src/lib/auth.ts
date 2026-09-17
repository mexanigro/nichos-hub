import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/types";
import type { Session } from "next-auth";
import { authConfig } from "@/auth.config";
import "./auth-types";

async function getUserRole(email: string): Promise<UserRole | null> {
  const ownerEmails = (process.env.OWNER_EMAIL || "")
    .toLowerCase()
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return ownerEmails.includes(email.toLowerCase()) ? "owner" : null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ user }) {
      return !!user.email;
    },
    async jwt({ token, user, trigger }) {
      if (user?.email || trigger === "update") {
        token.role = (await getUserRole((user?.email ?? token.email) as string)) ?? "lead";
        token.roleCheckedAt = Date.now();
      } else if (!token.role || (Date.now() - ((token.roleCheckedAt as number) || 0)) > 3_600_000) {
        token.role = (await getUserRole(token.email as string)) ?? "lead";
        token.roleCheckedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});

type RouteContext = { params: Promise<Record<string, string>> };
type AuthedHandler = (req: NextRequest, session: Session, ctx: RouteContext) => Promise<NextResponse>;

export function withOwner(handler: AuthedHandler): (req: NextRequest, ctx: RouteContext) => Promise<NextResponse> {
  return async (req: NextRequest, ctx: RouteContext) => {
    const session = await auth();
    if (!session?.user?.role) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (session.user.role !== "owner") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    return handler(req, session, ctx);
  };
}
