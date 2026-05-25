import type { WizardData } from "./wizard-types";
import { createEmptyWizardData } from "./wizard-types";

const PREFIX = "arzac-wizard";

function getKey(variant: "free" | "paid", clientId?: string): string {
  if (variant === "paid" && clientId) return `${PREFIX}-paid-${clientId}`;
  return `${PREFIX}-free`;
}

export function saveWizardDraft(
  data: WizardData,
  variant: "free" | "paid",
  clientId?: string,
): void {
  try {
    const key = getKey(variant, clientId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadWizardDraft(
  variant: "free" | "paid",
  clientId?: string,
  locale = "en",
): WizardData {
  try {
    const key = getKey(variant, clientId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WizardData>;
      // Merge with defaults so new fields don't crash
      return { ...createEmptyWizardData(locale), ...parsed };
    }
  } catch {
    // Corrupt data — start fresh
  }
  return createEmptyWizardData(locale);
}

export function clearWizardDraft(
  variant: "free" | "paid",
  clientId?: string,
): void {
  try {
    const key = getKey(variant, clientId);
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
