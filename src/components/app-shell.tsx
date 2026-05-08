"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (status === "unauthenticated" && !isLoginPage) {
      router.push("/login");
    }
  }, [status, isLoginPage, router]);

  useEffect(() => {
    if (status === "loading") {
      const t = setTimeout(() => setTimedOut(true), 3000);
      return () => clearTimeout(t);
    }
    setTimedOut(false);
  }, [status]);

  if (status === "loading" && !timedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (status === "loading" && timedOut && !isLoginPage) {
    router.push("/login");
    return null;
  }

  if (isLoginPage || !session) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 pt-14 lg:pt-0 lg:ml-56">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
