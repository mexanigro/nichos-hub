// N08 T0/T1 — construcción pura de los documentos del alta (hub_clients, clients, config) y del
// destinatario del aviso al dueño. La ruta /api/clients/provision y deploy.ts consumen esto; el
// test src/lib/provisioning.test.ts fija el contrato: el alta deja config con el catálogo del nicho
// (services/staff del preset del template), businessRules, adminEmail, y pide el bootstrap del dueño.
import { buildFeatures, getDefaultTheme, getDefaultSplash, type BusinessNiche } from "./niche-defaults.ts";
import type { ClientLanguage } from "./client-language.ts";
import { getNichePreset, DEFAULT_BUSINESS_RULES } from "./client-config/niche-presets.ts";

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export type ProvisionInput = {
  businessName: string;
  niche: BusinessNiche;
  mode: "solo" | "team";
  slug: string;
  domain: string;
  language: ClientLanguage;
  phone?: string;
  email?: string;
  address?: string;
  instagram?: string;
  tagline?: string;
  description?: string;
  adminEmail?: string;
  now?: Date;
};

export type ProvisionDocs = {
  hubClient: Record<string, unknown>;
  client: Record<string, unknown>;
  config: Record<string, unknown>;
  /** Dueño a dar de alta en admin_users del tenant (null si no hay email). */
  ownerBootstrap: { email: string; clientId: string } | null;
};

export function buildProvisionDocs(input: ProvisionInput): ProvisionDocs {
  const now = input.now ?? new Date();
  const name = input.businessName.trim();
  const features = buildFeatures(input.niche, input.mode);
  const hubClient = {
    businessName: name,
    niche: input.niche,
    businessMode: input.mode,
    clientId: input.slug,
    status: "demo",
    deployUrl: `https://${input.domain}`,
    domain: input.domain,
    adminEmail: input.adminEmail || input.email || "",
    createdAt: now,
    activationDate: now,
    contact: {
      phone: input.phone || "",
      email: input.email || "",
      address: input.address || "",
      instagram: input.instagram || "",
    },
    description: input.description || "",
    language: input.language,
    notes: "",
  };
  const client = { status: "active" };
  const adminEmail = normalizeEmail(input.adminEmail) || normalizeEmail(input.email);
  const preset = getNichePreset(input.niche);
  // Catálogo del nicho (copia de los presets he del template): el servidor valida contra esto y los
  // emails usan estos nombres. Los arrays reemplazan al preset del bundle (mergeDeep del template).
  const catalog = preset
    ? {
        services: preset.services,
        staff: input.mode === "solo" ? preset.staff.slice(0, 1) : preset.staff,
        businessRules: { ...DEFAULT_BUSINESS_RULES },
      }
    : {};
  const config = {
    ...catalog,
    ...(adminEmail ? { adminEmail } : {}),
    business: { type: input.niche, mode: input.mode, name },
    brand: { name, tagline: input.tagline || "", description: input.description || "" },
    contact: { phone: input.phone || "", email: input.email || "", address: { street: input.address || "" } },
    features,
    activeTheme: getDefaultTheme(input.niche),
    splash: { enabled: true, variant: getDefaultSplash(input.niche) },
    language: input.language,
  };
  return { hubClient, client, config, ownerBootstrap: adminEmail ? { email: adminEmail, clientId: input.slug } : null };
}

/** Destinatario del aviso de reserva al dueño que deploy.ts propaga como BUSINESS_OWNER_EMAIL. */
export function resolveOwnerNotificationEmail(configData: Record<string, unknown>, hubData?: Record<string, unknown>): string | undefined {
  return normalizeEmail(configData.adminEmail) || normalizeEmail(hubData?.adminEmail) || undefined;
}
