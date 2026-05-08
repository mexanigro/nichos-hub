import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _db: Firestore | null = null;

function getDb(): Firestore {
  if (_db) return _db;

  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        `Firebase Admin credentials not configured (projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey})`,
      );
    }

    // Sanitize private key: strip wrapping quotes, normalize newlines, trim whitespace
    let cleanKey = privateKey.trim();
    if ((cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
        (cleanKey.startsWith("'") && cleanKey.endsWith("'"))) {
      cleanKey = cleanKey.slice(1, -1);
    }
    cleanKey = cleanKey.replace(/\\n/g, "\n");

    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey: cleanKey,
    };
    initializeApp({ credential: cert(serviceAccount) });
  }

  const databaseId = process.env.FIREBASE_DATABASE_ID;
  _db = databaseId ? getFirestore(databaseId) : getFirestore();

  // Use REST API instead of gRPC — more compatible with Railway/serverless
  _db.settings({ preferRest: true });

  return _db;
}

export const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    const firestore = getDb();
    const value = (firestore as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return (value as Function).bind(firestore);
    }
    return value;
  },
});
