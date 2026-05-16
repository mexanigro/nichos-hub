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
import { clientAuth, clientDb } from "./firebase-client";

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
  const result = await signInWithPopup(clientAuth, googleProvider);
  await upsertLead(result.user, "google");
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(clientAuth, email, password);
  await upsertLead(result.user, "email");
  return result.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(clientAuth, email, password);
  await updateProfile(result.user, { displayName });
  await upsertLead(result.user, "email");
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(clientAuth);
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return firebaseOnAuthStateChanged(clientAuth, callback);
}

export async function getLeadData(uid: string): Promise<HubLead | null> {
  const snap = await getDoc(doc(clientDb, "hub_leads", uid));
  return snap.exists() ? (snap.data() as HubLead) : null;
}

export async function saveBuilderDataToLead(
  uid: string,
  builderData: Record<string, unknown>
): Promise<void> {
  await setDoc(
    doc(clientDb, "hub_leads", uid),
    { builderData, lastLoginAt: serverTimestamp() },
    { merge: true }
  );
}

async function upsertLead(user: User, provider: "google" | "email"): Promise<void> {
  const ref = doc(clientDb, "hub_leads", user.uid);
  // Always merge — avoids TOCTOU race between getDoc and setDoc.
  // Fields like email/name update each login; createdAt only written once
  // because Firestore merge won't overwrite existing fields with new values
  // if we only send them on first write. But since we can't conditionally
  // include fields in a merge, we check existence first for the initial seed,
  // and the merge ensures no data loss on race.
  const snap = await getDoc(ref);

  if (snap.exists()) {
    // Existing user — update last login + current profile info
    await setDoc(ref, {
      email: user.email || "",
      name: user.displayName || "",
      photoURL: user.photoURL || "",
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  } else {
    // New user — seed all fields with merge:true to prevent race overwrite
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
