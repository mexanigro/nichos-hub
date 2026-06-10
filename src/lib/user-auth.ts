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
import { getClientAuth } from "./firebase-client";

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
  if (!auth) throw new Error("El servicio de autenticación no está disponible. Intenta recargar la página.");
  const result = await signInWithPopup(auth, googleProvider);
  await upsertLead(result.user, "google");
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getClientAuth();
  if (!auth) throw new Error("El servicio de autenticación no está disponible. Intenta recargar la página.");
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
  if (!auth) throw new Error("El servicio de autenticación no está disponible. Intenta recargar la página.");
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
    callback(null);
    return () => {};
  }
  return firebaseOnAuthStateChanged(auth, callback);
}

/** idToken del usuario logueado actual — requerido por los endpoints de lead. */
async function getCurrentIdToken(): Promise<string | null> {
  try {
    const auth = getClientAuth();
    const user = auth?.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

export async function getLeadData(uid: string): Promise<HubLead | null> {
  try {
    const idToken = await getCurrentIdToken();
    if (!idToken) return null;
    const res = await fetch(`/api/auth/lead?uid=${encodeURIComponent(uid)}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return null;
    const { lead } = await res.json();
    return lead ?? null;
  } catch {
    return null;
  }
}

export async function saveBuilderDataToLead(
  uid: string,
  builderData: Record<string, unknown>
): Promise<void> {
  const idToken = await getCurrentIdToken();
  await fetch("/api/auth/upsert-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, builderData, idToken }),
  });
}

async function upsertLead(user: User, provider: "google" | "email"): Promise<void> {
  try {
    const idToken = await user.getIdToken();
    await fetch("/api/auth/upsert-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || "",
        photoURL: user.photoURL || "",
        provider,
        idToken,
      }),
    });
  } catch {
    // Non-critical — login still succeeds even if lead upsert fails
  }
}
