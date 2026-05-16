/**
 * One-time migration: reads all hub_clients and ensures a corresponding
 * `clients/{clientId}` doc exists with { status }. This is required because
 * the master-template's Firestore rules check `clients/{clientId}.status`
 * before allowing appointment creation.
 *
 * Run: npx tsx scripts/seed-clients-collection.ts
 * Requires: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

async function main() {
  const snap = await db.collection("hub_clients").get();
  console.log(`Found ${snap.size} hub_clients documents.`);

  let synced = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const clientId = data.clientId;

    if (!clientId) {
      console.warn(`  SKIP: doc ${doc.id} has no clientId field`);
      skipped++;
      continue;
    }

    const status = data.status || "active";
    await db.collection("clients").doc(clientId).set(
      { status },
      { merge: true },
    );
    console.log(`  SYNCED: clients/${clientId} → status: ${status}`);
    synced++;
  }

  console.log(`\nDone. Synced: ${synced}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
