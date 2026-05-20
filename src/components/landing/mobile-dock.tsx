"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Home, CreditCard, MessageCircle, User, LogIn } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useUserAuth } from "@/lib/user-auth-context";

interface MobileDockProps {
  onAuthClick: () => void;
}

export function MobileDock({ onAuthClick }: MobileDockProps) {
  const { t } = useT();
  const { user, loading } = useUserAuth();
  const prefersReduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastY = 0;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Show after scrolling past hero (~250px)
        if (y > 250) {
          setVisible(true);
        } else {
          setVisible(false);
        }
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = [
    {
      label: t.nav.home || "Inicio",
      icon: Home,
      action: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    },
    {
      label: t.nav.pricing,
      icon: CreditCard,
      action: () =>
        document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }),
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      action: () =>
        window.open(`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "")}`, "_blank"),
    },
    {
      label:
        !loading && user
          ? user.displayName?.split(" ")[0] || "Cuenta"
          : "Entrar",
      icon: !loading && user ? User : LogIn,
      action: () => {
        if (!loading && user) {
          window.location.href = "/mi-cuenta";
        } else {
          onAuthClick();
        }
      },
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-2xl border border-[var(--l-glass-border)] bg-[var(--l-glass)] px-2 py-2 backdrop-blur-xl md:hidden"
          style={{
            paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
            boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
          }}
          aria-label="Mobile navigation"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[var(--l-text-3)] transition-colors duration-200 hover:text-[var(--l-text)] active:scale-[0.95]"
              >
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="text-[0.65rem] font-medium leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
