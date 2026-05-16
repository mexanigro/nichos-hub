"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getClientAuth, getClientDb } from "./firebase-client";

export type { User };

export interface HubLead {
  email: string;
  name: string;
  photoURL?: string;
  provider: "google" | "email";
  plan?: "web_crm" | "completo" | null;
  clientId?: string;
  builderData?: Record<string, unknown>;
  createdAt: unknown;
  lastLoginAt: unknown;
}

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const auth = getClientAuth();
  if (!auth) throw new Error("Firebase not initialized");
  const result = await signInWithPopup(auth, googleProvider);
  await upsertLead(result.user, "google");
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getClientAuth();
  if (!auth) throw new Error("Firebase not initialized");
  const result = await signInWithEmailAndPassword(auth, email, password);
  await upsertLead(result.user, "email");
  return result.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const auth = getClientAuth();
  if (!auth) throw new Error("Firebase not initialized");
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await upsertLead(result.user, "email");
  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = getClientAuth();
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  const auth = getClientAuth();
  if (!auth) {
    // During SSR/build — just report no user and return a no-op unsubscribe
    callback(null);
    return () => {};
  }
  return firebaseOnAuthStateChanged(auth, callback);
}

export async function getLeadData(uid: string): Promise<HubLead | null> {
  const db = getClientDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "hub_leads", uid));
  return snap.exists() ? (snap.data() as HubLead) : null;
}

export async function saveBuilderDataToLead(
  uid: string,
  builderData: Record<string, unknown>
): Promise<void> {
  const db = getClientDb();
  if (!db) return;
  await setDoc(
    doc(db, "hub_leads", uid),
    { builderData, lastLoginAt: serverTimestamp() },
    { merge: true }
  );
}

async function upsertLead(user: User, provider: "google" | "email"): Promise<void> {
  const db = getClientDb();
  if (!db) return;
  const ref = doc(db, "hub_leads", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await setDoc(ref, {
      email: user.email || "",
      name: user.displayName || "",
      photoURL: user.photoURL || "",
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  } else {
    await setDoc(ref, {
      email: user.email || "",
      name: user.displayName || "",
      photoURL: user.photoURL || "",
      provider,
      plan: null,
      clientId: null,
      builderData: null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  }
}
