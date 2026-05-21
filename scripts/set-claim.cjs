/**
 * Script para setear custom claims en Firebase Auth.
 * Uso: node scripts/set-claim.cjs <email> <clientId>
 */
const fs = require("fs");
const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Cargar .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

const pk = (env.FIREBASE_PRIVATE_KEY || "").split("\\n").join("\n");

initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: pk,
  }),
});

const auth = getAuth();
const email = process.argv[2] || "liam.arzac@gmail.com";
const clientId = process.argv[3] || "client_nails_demo";

(async () => {
  const user = await auth.getUserByEmail(email);
  console.log("Usuario:", user.uid, user.email);
  console.log("Claims actuales:", JSON.stringify(user.customClaims));

  const current = user.customClaims || {};
  await auth.setCustomUserClaims(user.uid, {
    ...current,
    clientId,
    tenantRole: "owner",
  });

  await auth.revokeRefreshTokens(user.uid);

  const updated = await auth.getUserByEmail(email);
  console.log("Claims nuevos:", JSON.stringify(updated.customClaims));
  console.log(`\nListo — clientId seteado a "${clientId}". Cerrá sesión y volvé a entrar.`);
})().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
