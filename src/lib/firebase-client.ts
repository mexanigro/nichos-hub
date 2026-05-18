"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase client config — these are PUBLIC keys (safe to commit).
// Hardcoded because Turbopack + "use client" doesn't reliably inline
// process.env.NEXT_PUBLIC_* at build time.
const firebaseConfig = {
  apiKey: "AIzaSyAG6e1t-UvDmc-lbzAxFDuNgLz07YK9Cgo",
  authDomain: "barbertemplate-madre.firebaseapp.com",
  projectId: "barbertemplate-madre",
  storageBucket: "barbertemplate-madre.firebasestorage.app",
  messagingSenderId: "294619240670",
  appId: "1:294619240670:web:bb3d0a4e0e11a69d9f0a4f",
};

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

function getApp_(): FirebaseApp | null {
  // Don't initialize if config is empty (build time on Railway)
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  if (!_app) {
    _app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

/** Returns Firebase Auth instance, or null if config is unavailable (SSR/build). */
export function getClientAuth(): Auth | null {
  if (_auth) return _auth;
  const app = getApp_();
  if (!app) return null;
  _auth = getAuth(app);
  return _auth;
}

/** Returns Firestore instance, or null if config is unavailable (SSR/build). */
export function getClientDb(): Firestore | null {
  if (_db) return _db;
  const app = getApp_();
  if (!app) return null;
  _db = getFirestore(app);
  return _db;
}
