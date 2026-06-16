/**
 * Startup validation of required environment variables.
 * Import this module at app init (instrumentation.ts) to catch
 * misconfigurations before they cause cryptic runtime errors.
 */

// Each entry is either a required var name, or an array of acceptable
// alternatives (any one present satisfies the requirement). The Auth secret
// uses alternatives because next-auth v5 reads `AUTH_SECRET ?? NEXTAUTH_SECRET`
// (see next-auth/lib/env.js); production may use the legacy NEXTAUTH_SECRET.
const REQUIRED_GROUPS: Record<string, (string | string[])[]> = {
  Auth: [
    "OWNER_EMAIL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    ["AUTH_SECRET", "NEXTAUTH_SECRET"],
  ],
  Firebase: [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ],
  Payments: [
    "CARDCOM_TERMINAL",
    "CARDCOM_API_NAME",
  ],
  Security: [
    "CRON_SECRET",
  ],
};

const RECOMMENDED: string[] = [
  "NEXTAUTH_URL",
  "DEPLOY_SECRET",
  "AGENT_API_SECRET",
  "ANTHROPIC_API_KEY",
];

export function checkEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const [group, vars] of Object.entries(REQUIRED_GROUPS)) {
    for (const v of vars) {
      const alternatives = Array.isArray(v) ? v : [v];
      const satisfied = alternatives.some((name) => process.env[name]);
      if (!satisfied) {
        missing.push(`[${group}] ${alternatives.join(" or ")}`);
      }
    }
  }

  for (const v of RECOMMENDED) {
    if (!process.env[v]) {
      warnings.push(v);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n❌ CRITICAL: Missing required environment variables:\n${missing.map((m) => `   - ${m}`).join("\n")}\n` +
      `The app may malfunction without these. Check your .env.local or Railway env vars.\n`,
    );

    const isProduction = process.env.NODE_ENV === "production";
    const isDemoMode = process.env.DEMO_MODE === "true";
    if (isProduction && !isDemoMode) {
      console.error("💀 Exiting — cannot start in production without required environment variables.");
      process.exit(1);
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `⚠️  Optional env vars not set (some features will be disabled): ${warnings.join(", ")}`,
    );
  }

  if (missing.length === 0) {
    console.log("✓ All required environment variables are set");
  }
}
