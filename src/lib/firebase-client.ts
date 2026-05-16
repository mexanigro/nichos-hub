"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
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
