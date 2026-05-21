import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth, type Auth as AdminAuth } from "firebase-admin/auth";

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

    let cleanKey = privateKey.trim();
    // Strip wrapping quotes (single, double, or backtick)
    if (/^["'`]/.test(cleanKey) && cleanKey[0] === cleanKey[cleanKey.length - 1]) {
      cleanKey = cleanKey.slice(1, -1);
    }
    // Convert literal \n sequences to real newlines
    cleanKey = cleanKey.replace(/\\n/g, "\n");
    // Handle double-escaped newlines (\\n → \n)
    cleanKey = cleanKey.replace(/\\\n/g, "\n");

    if (!cleanKey.includes("-----BEGIN")) {
      console.error("[firebase-admin] Private key appears malformed — missing BEGIN marker");
    }

    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey: cleanKey,
    };
    initializeApp({ credential: cert(serviceAccount) });
  }

  const databaseId = process.env.FIREBASE_DATABASE_ID;
  _db = databaseId ? getFirestore(databaseId) : getFirestore();

  try {
    _db.settings({ preferRest: true });
  } catch {
    // Already initialized during HMR — safe to ignore
  }

  return _db;
}

let _auth: AdminAuth | null = null;

function getAuthInstance(): AdminAuth {
  if (_auth) return _auth;
  // Calling getDb() ensures the app is initialized
  getDb();
  _auth = getAdminAuth();
  return _auth;
}

export const auth = new Proxy({} as AdminAuth, {
  get(_target, prop) {
    const a = getAuthInstance();
    const value = (a as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return (value as Function).bind(a);
    }
    return value;
  },
});

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
