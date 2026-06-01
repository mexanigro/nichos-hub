"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Rocket,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Scissors,
  Sparkles,
  Palette,
  Coffee,
  Hammer,
  PenTool,
  User,
  Users,
} from "lucide-react";

type BusinessNiche = "barberia" | "estetica" | "tattoo" | "nails" | "cafeteria" | "remodelaciones";

const NICHES: { id: BusinessNiche; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "barberia", label: "Barbería", icon: Scissors },
  { id: "estetica", label: "Estética", icon: Sparkles },
  { id: "tattoo", label: "Tattoo", icon: PenTool },
  { id: "nails", label: "Nails", icon: Palette },
  { id: "cafeteria", label: "Cafetería", icon: Coffee },
  { id: "remodelaciones", label: "Remodelaciones", icon: Hammer },
];

const LANGUAGES = [
  { value: "he", label: "Hebreo" },
  { value: "en", label: "Inglés" },
  { value: "ru", label: "Ruso" },
  { value: "ar", label: "Árabe" },
  { value: "es", label: "Español" },
];

type ProvisionState = "form" | "deploying" | "success" | "error";

interface ProvisionResult {
  hubDocId: string;
  clientId: string;
  domain: string;
  deployStatus: string;
  deployError: string | null;
}

export default function NewClientPage() {
  const router = useRouter();
  const [state, setState] = useState<ProvisionState>("form");
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [error, setError] = useState("");

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState<BusinessNiche>("barberia");
  const [businessMode, setBusinessMode] = useState<"solo" | "team">("team");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("he");
  const [adminEmail, setAdminEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim() || businessName.trim().length < 2) {
      setError("El nombre del negocio es obligatorio (min 2 caracteres)");
      return;
    }

    setState("deploying");
    setError("");

    try {
      const res = await fetch("/api/clients/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          niche,
          businessMode,
          phone,
          email,
          address,
          instagram,
          description,
          language,
          adminEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear el cliente");
        setState("error");
        return;
      }

      setResult(data);
      setState(data.deployStatus === "error" ? "error" : "success");
    } catch {
      setError("Error de conexion. Verifica tu red.");
      setState("error");
    }
  }

  if (state === "deploying") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-accent" />
        <div className="text-center">
          <p className="text-sm font-medium text-text">Provisionando cliente...</p>
          <p className="mt-1 text-xs text-text-muted">
            Creando documentos en Firebase y proyecto en Vercel
          </p>
        </div>
      </div>
    );
  }

  if (state === "success" && result) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
          <CheckCircle size={40} className="mx-auto mb-4 text-green-500" />
          <h2 className="text-lg font-semibold text-text">Cliente creado exitosamente</h2>
          <p className="mt-2 text-sm text-text-muted">
            El proyecto se esta deployando en Vercel. Estara listo en ~2 minutos.
          </p>

          <div className="mt-6 space-y-3 rounded-lg bg-bg-elevated p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Client ID</span>
              <code className="rounded bg-bg-card px-2 py-0.5 text-xs text-accent">{result.clientId}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Dominio</span>
              <a
                href={`https://${result.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                {result.domain} <ExternalLink size={10} />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Estado</span>
              <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-500">
                Demo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Deploy</span>
              <span className="text-xs text-text-secondary">Building...</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push(`/clients/${result.hubDocId}`)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-medium text-white hover:bg-accent-hover"
            >
              Ir al dashboard del cliente
            </button>
            <button
              onClick={() => {
                setState("form");
                setResult(null);
                setBusinessName("");
                setDescription("");
                setPhone("");
                setEmail("");
                setAddress("");
                setInstagram("");
                setAdminEmail("");
                setNiche("barberia");
                setLanguage("he");
                setBusinessMode("team");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-medium text-text-secondary hover:bg-bg-hover"
            >
              Crear otro cliente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/clients")}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={14} /> Volver a clientes
        </button>
        <h1 className="text-lg font-semibold text-text">Nuevo cliente</h1>
        <p className="mt-1 text-xs text-text-muted">
          Completa los datos del negocio. Se creara como demo y podras activarlo cuando este listo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Required Section ─────────────────────────────────────────── */}
        <fieldset className="rounded-xl border border-border bg-bg-card p-5">
          <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
            Requerido
          </legend>

          <div className="space-y-4">
            {/* Business Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text">
                Nombre del negocio <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: Barbería Don Julio"
                required
                minLength={2}
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1 text-[10px] text-text-muted">
                Se usa para el dominio (auto-generado), el titulo de la web y la marca.
              </p>
            </div>

            {/* Niche */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text">
                Nicho <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {NICHES.map((n) => {
                  const Icon = n.icon;
                  const selected = niche === n.id;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setNiche(n.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                        selected
                          ? "border-accent bg-accent/10 text-accent ring-1 ring-accent/30"
                          : "border-border bg-bg-elevated text-text-muted hover:border-border hover:bg-bg-hover"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[10px] font-medium">{n.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business Mode */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text">Modalidad</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBusinessMode("team")}
                  className={`flex items-center gap-2 rounded-lg border p-3 transition-all ${
                    businessMode === "team"
                      ? "border-accent bg-accent/10 text-text ring-1 ring-accent/30"
                      : "border-border bg-bg-elevated text-text-muted hover:bg-bg-hover"
                  }`}
                >
                  <Users size={16} />
                  <div className="text-left">
                    <span className="block text-xs font-medium">Equipo</span>
                    <span className="text-[10px] text-text-muted">Multiples profesionales</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setBusinessMode("solo")}
                  className={`flex items-center gap-2 rounded-lg border p-3 transition-all ${
                    businessMode === "solo"
                      ? "border-accent bg-accent/10 text-text ring-1 ring-accent/30"
                      : "border-border bg-bg-elevated text-text-muted hover:bg-bg-hover"
                  }`}
                >
                  <User size={16} />
                  <div className="text-left">
                    <span className="block text-xs font-medium">Solo</span>
                    <span className="text-[10px] text-text-muted">Un profesional</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text">Idioma de la web</label>
              <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLanguage(l.value)}
                    className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                      language === l.value
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-bg-elevated text-text-muted hover:bg-bg-hover"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </fieldset>

        {/* ── Contact Section ─────────────────────────────────────────── */}
        <fieldset className="rounded-xl border border-border bg-bg-card p-5">
          <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Contacto
          </legend>
          <p className="mb-4 text-[10px] text-text-muted">
            Se muestra en la web del cliente. Podes completarlo despues desde Config.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">Telefono / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+972..."
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="negocio@email.com"
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">Direccion</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, Ciudad"
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">Instagram</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@negocio"
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* ── Extra Section ────────────────────────────────────────────── */}
        <fieldset className="rounded-xl border border-border bg-bg-card p-5">
          <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Adicional
          </legend>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">Descripcion / Tagline</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripcion del negocio — se muestra en el hero y SEO"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Email del dueño para acceder al admin panel de su web"
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-text-muted">
                El email con el que el cliente inicia sesion en su propio panel de administracion.
              </p>
            </div>
          </div>
        </fieldset>

        {/* ── Preview ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-dashed border-border bg-bg-elevated/50 p-4">
          <p className="mb-2 text-[11px] font-semibold text-text-muted">Se va a crear:</p>
          <div className="space-y-1.5 text-xs text-text-secondary">
            <p>
              <span className="text-text-muted">Firestore:</span>{" "}
              <code className="text-accent">hub_clients</code> +{" "}
              <code className="text-accent">clients/demo-...</code> +{" "}
              <code className="text-accent">config/demo-...</code>
            </p>
            <p>
              <span className="text-text-muted">Vercel:</span> Proyecto desde{" "}
              <code className="text-accent">mexanigro/Barber-shop-template</code>
            </p>
            <p>
              <span className="text-text-muted">Dominio:</span>{" "}
              <code className="text-accent">
                demo-{businessName ? slugifyPreview(businessName) : "nombre"}-xxx.arzac.studio
              </code>
            </p>
            <p>
              <span className="text-text-muted">Estado inicial:</span>{" "}
              <span className="rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-500">Demo</span>
              {" "}— activalo cuando este configurado
            </p>
          </div>
        </div>

        {/* ── Error ───────────────────────────────────────────────────── */}
        {(error || state === "error") && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
              <div>
                <p className="text-xs font-medium text-red-400">Error</p>
                {error && <p className="text-[11px] text-red-400/80">{error}</p>}
                {result?.deployError && (
                  <p className="mt-1 text-[11px] text-red-400/80">
                    Vercel: {result.deployError}
                  </p>
                )}
                {result && (
                  <p className="mt-1 text-[10px] text-text-muted">
                    Los documentos en Firebase se crearon correctamente. Podes reintentar el deploy desde el dashboard del cliente.
                  </p>
                )}
              </div>
            </div>
            {result && (
              <button
                onClick={() => router.push(`/clients/${result.hubDocId}`)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover"
              >
                Ir al dashboard del cliente
              </button>
            )}
          </div>
        )}

        {/* ── Submit ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => router.push("/clients")}
            className="rounded-lg px-4 py-2.5 text-xs font-medium text-text-secondary hover:text-text"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Rocket size={14} />
            Crear y deployar
          </button>
        </div>
      </form>
    </div>
  );
}

function slugifyPreview(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
}
