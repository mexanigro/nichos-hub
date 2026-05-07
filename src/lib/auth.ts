import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "./firebase-admin";
import type { UserRole } from "@/types";
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
      if (!user.email) return false;
      const role = await getUserRole(user.email);
      return role !== null;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.role = await getUserRole(user.email);
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

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.role) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireOwner() {
  const session = await requireAuth();
  if (session.user.role !== "owner") {
    throw new Error("Forbidden");
  }
  return session;
}
