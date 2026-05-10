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
  const isPublicPage = pathname.startsWith("/pago");

  useEffect(() => {
    if (status === "unauthenticated" && !isLoginPage && !isPublicPage) {
      router.push("/login");
    }
  }, [status, isLoginPage, isPublicPage, router]);

  useEffect(() => {
    if (status === "loading") {
      const t = setTimeout(() => setTimedOut(true), 3000);
      return () => clearTimeout(t);
    }
    setTimedOut(false);
  }, [status]);

  if (status === "loading" && !timedOut && !isPublicPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (status === "loading" && timedOut && !isLoginPage && !isPublicPage) {
    router.push("/login");
    return null;
  }

  if (isLoginPage || isPublicPage || !session) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="sidebar-offset min-h-screen pt-14">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
          {children}
        </div>
      </main>
    </>
  );
}
