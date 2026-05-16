import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { NextRequest, NextResponse } from "next/server";
import { db } from "./firebase-admin";
import type { UserRole } from "@/types";
import type { Session } from "next-auth";
import "./auth-types";

async function getUserRole(email: string): Promise<UserRole | null> {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (email.toLowerCase() === ownerEmail?.toLowerCase()) {
    return "owner";
  }

  const snap = await db.collection("hub_users").doc(email.toLowerCase()).get();
  if (snap.exists && snap.data()?.role === "seller") {
    return "seller";
  }

  return null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return !!user.email;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.role = (await getUserRole(user.email)) ?? "lead";
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
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

type RouteContext = { params: Promise<Record<string, string>> };
type AuthedHandler = (req: NextRequest, session: Session, ctx: RouteContext) => Promise<NextResponse>;

function withRole(role: "owner" | null, handler: AuthedHandler): (req: NextRequest, ctx: RouteContext) => Promise<NextResponse> {
  return async (req: NextRequest, ctx: RouteContext) => {
    const session = await auth();
    if (!session?.user?.role) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (session.user.role === "lead") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    if (role && session.user.role !== role) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    return handler(req, session, ctx);
  };
}

export function withOwner(handler: AuthedHandler) {
  return withRole("owner", handler);
}

export function withAuth(handler: AuthedHandler) {
  return withRole(null, handler);
}
