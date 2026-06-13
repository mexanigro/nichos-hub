/**
 * Startup validation of required environment variables.
 * Import this module at app init (instrumentation.ts) to catch
 * misconfigurations before they cause cryptic runtime errors.
 */

const REQUIRED_GROUPS: Record<string, string[]> = {
  Auth: [
    "OWNER_EMAIL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "AUTH_SECRET",
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
      if (!process.env[v]) {
        missing.push(`[${group}] ${v}`);
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
