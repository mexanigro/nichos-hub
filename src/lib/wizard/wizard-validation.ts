import type { WizardData } from "./wizard-types";

// Validators return error keys matching t.wizard.err* for i18n translation
export function validateNiche(data: WizardData): string | null {
  if (!data.niche) return "errNiche";
  if (data.niche === "otro" && !data.customNiche.trim()) return "errCustomNiche";
  return null;
}

export function validateMode(data: WizardData): string | null {
  if (!data.businessMode) return "errMode";
  return null;
}

export function validateBusiness(data: WizardData): string | null {
  if (!data.businessName.trim() || data.businessName.trim().length < 2)
    return "errBusinessName";
  return null;
}

export function validateContact(data: WizardData): string | null {
  const hasAny =
    data.whatsapp.trim() ||
    data.email.trim() ||
    data.phone.trim() ||
    data.instagram.trim();
  if (!hasAny) return "errContact";
  if (data.email.trim() && !data.email.includes("@")) return "errEmail";
  return null;
}

export function validateOptional(): string | null {
  return null;
}

export function validateDemoContact(data: WizardData): string | null {
  const email = data.email.trim();
  if (!email) return "errEmail";
  if (!email.includes("@") || email.length < 5) return "errEmail";
  return null;
}
