"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/lib/user-auth-context";
import { getLeadData, signOut, type HubLead } from "@/lib/user-auth";
import { AuthModal } from "@/components/landing/auth-modal";

export default function MiCuentaPage() {
  const { user, loading } = useUserAuth();
  const router = useRouter();
  const [lead, setLead] = useState<HubLead | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setAuthOpen(true);
      setLoadingLead(false);
    }
    if (user) {
      getLeadData(user.uid).then((data) => {
        setLead(data);
        setLoadingLead(false);
      });
    }
  }, [user, loading]);

  if (loading || loadingLead) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fafafa] px-6">
        <p className="text-lg font-medium text-gray-800">Iniciá sesión para ver tu cuenta</p>
        <button
          onClick={() => setAuthOpen(true)}
          className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Iniciar sesión
        </button>
        <AuthModal open={authOpen} onClose={() => router.push("/")} onSuccess={() => setAuthOpen(false)} />
      </div>
    );
  }

  const planLabel = lead?.plan === "completo"
    ? "Completo"
    : lead?.plan === "web_crm"
      ? "Web + CRM"
      : null;

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-12">
      <div className="mx-auto max-w-[560px]">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="Arzac Studio" className="h-8 w-8" />
            <span className="hidden items-baseline gap-0.5 sm:flex">
              <span className="text-[0.95rem] font-bold tracking-tight text-gray-900">ARZAC</span>
              <span className="text-[0.6rem] font-medium text-teal-600">.studio</span>
            </span>
          </a>
          <button
            onClick={async () => { await signOut(); router.push("/"); }}
            className="text-[0.82rem] text-gray-500 transition-colors hover:text-gray-800"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-900 text-lg font-bold text-white">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                (user.displayName || user.email || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {user.displayName || "Usuario"}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Plan Section */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-[0.9rem] font-semibold text-gray-900">Tu plan</h2>

          {planLabel ? (
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-[0.8rem] font-semibold text-green-700">
                  {planLabel}
                </span>
                <span className="text-sm text-gray-500">
                  {lead?.plan === "completo" ? "₪990/mes" : "₪790/mes"}
                </span>
              </div>

              {lead?.plan === "web_crm" && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <p className="text-[0.85rem] font-medium text-blue-900">Upgrade a Completo</p>
                  <p className="mt-1 text-[0.8rem] text-blue-700">
                    Agrega el agente WhatsApp IA 24/7 por solo ₪200/mes más
                  </p>
                  <a
                    href={lead?.clientId ? `/pago/${lead.clientId}?plan=completo&upgrade=true` : "#"}
                    className="mt-3 inline-block rounded-full bg-blue-600 px-5 py-2 text-[0.82rem] font-semibold text-white transition-all hover:bg-blue-700"
                  >
                    Hacer upgrade
                  </a>
                </div>
              )}

              {lead?.clientId && (
                <a
                  href={`https://${lead.clientId}.arzac.studio`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-[0.85rem] font-medium text-gray-700 transition-colors hover:text-gray-900"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Ver mi sitio web
                </a>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-gray-500">No tenés un plan activo</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-sm">
                  <p className="font-semibold text-gray-900">Web + CRM</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">₪790<span className="text-sm font-normal text-gray-500">/mes</span></p>
                  <ul className="mt-3 space-y-1.5 text-[0.8rem] text-gray-600">
                    <li>✓ Sitio web profesional</li>
                    <li>✓ CRM con asistente IA</li>
                    <li>✓ Reservas online</li>
                    <li>✓ Inventario/stock</li>
                  </ul>
                  <a
                    href={lead?.clientId ? `/pago/${lead.clientId}?plan=web_crm` : "/#builder"}
                    className="mt-4 block rounded-full bg-gray-900 px-4 py-2.5 text-center text-[0.82rem] font-semibold text-white transition-all hover:bg-gray-800"
                  >
                    Elegir plan
                  </a>
                </div>
                <div className="rounded-xl border-2 border-gray-900 p-4">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">Completo</p>
                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[0.7rem] font-semibold text-white">Popular</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-gray-900">₪990<span className="text-sm font-normal text-gray-500">/mes</span></p>
                  <ul className="mt-3 space-y-1.5 text-[0.8rem] text-gray-600">
                    <li>✓ Todo de Web+CRM</li>
                    <li>✓ Agente WhatsApp IA 24/7</li>
                    <li>✓ Captura de leads</li>
                    <li>✓ Turnos por WhatsApp</li>
                  </ul>
                  <a
                    href={lead?.clientId ? `/pago/${lead.clientId}?plan=completo` : "/#builder"}
                    className="mt-4 block rounded-full bg-gray-900 px-4 py-2.5 text-center text-[0.82rem] font-semibold text-white transition-all hover:bg-gray-800"
                  >
                    Elegir plan
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        {planLabel && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
            <h2 className="text-[0.9rem] font-semibold text-red-800">Zona de riesgo</h2>
            <p className="mt-1 text-[0.82rem] text-gray-500">
              Si cancelás tu plan, tu sitio se desactivará después de 30 días
            </p>
            <button
              className="mt-3 rounded-full border border-red-200 px-4 py-2 text-[0.82rem] font-medium text-red-600 transition-all hover:bg-red-50"
              onClick={() => {
                window.location.href = `mailto:website@arzac.studio?subject=Cancelar%20suscripción&body=Quiero%20cancelar%20mi%20plan%20(${user.email})`;
              }}
            >
              Solicitar cancelación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
