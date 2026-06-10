export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkEnvironment } = await import("@/lib/env-check");
    checkEnvironment();
  }
}
