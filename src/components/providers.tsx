"use client";

import { SessionProvider } from "next-auth/react";
import { UserAuthProvider } from "@/lib/user-auth-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <UserAuthProvider>{children}</UserAuthProvider>
    </SessionProvider>
  );
}
