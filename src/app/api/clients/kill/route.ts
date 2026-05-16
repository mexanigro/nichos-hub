import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const POST = withOwner(async (req) => {
  const { clientDocId, paused } = (await req.json()) as {
    clientDocId: string;
    paused: boolean;
  };

  if (!clientDocId || typeof paused !== "boolean") {
    return NextResponse.json(
      { error: "clientDocId y paused son requeridos" },
      { status: 400 },
    );
  }

  // Get client to find vercelProjectId
  const doc = await db.collection("hub_clients").doc(clientDocId).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const client = doc.data()!;
  const vercelProjectId = client.vercelProjectId;

  if (!vercelProjectId) {
    return NextResponse.json(
      { error: "Este cliente no tiene un Vercel Project ID configurado" },
      { status: 400 },
    );
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "VERCEL_TOKEN no configurado en el servidor" },
      { status: 500 },
    );
  }

  // Call Vercel API to pause/unpause the project
  const teamId = process.env.VERCEL_TEAM_ID;
  const action = paused ? "pause" : "unpause";
  const url = `https://api.vercel.com/v1/projects/${vercelProjectId}/${action}${teamId ? `?teamId=${teamId}` : ""}`;

  const vercelRes = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!vercelRes.ok) {
    const err = await vercelRes.text();
    console.error("[kill-switch] Vercel API error:", vercelRes.status, err);
    return NextResponse.json(
      { error: `Vercel respondió con ${vercelRes.status}` },
      { status: 502 },
    );
  }

  const newStatus = paused ? "suspended" : "active";

  try {
    await db.collection("hub_clients").doc(clientDocId).update({ status: newStatus });

    // Sync to clients/{clientId} — template Firestore rules enforce status from this collection.
    const clientId = client.clientId;
    if (clientId) {
      await db.collection("clients").doc(clientId).set(
        { status: newStatus },
        { merge: true },
      );
    }
  } catch (err) {
    console.error("[kill-switch] Firestore update failed after Vercel succeeded:", err);
    return NextResponse.json({ error: "Vercel actualizado pero error en base de datos" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    paused,
    message: paused
      ? "Proyecto pausado en Vercel. El sitio dejará de funcionar."
      : "Proyecto reactivado en Vercel. El sitio volverá a estar online.",
  });
});
