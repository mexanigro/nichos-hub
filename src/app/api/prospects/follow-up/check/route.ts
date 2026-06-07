import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "hub_prospect_followups";

export const POST = withOwner(async () => {
  const snap = await db
    .collection(COLLECTION)
    .where("status", "==", "web_sent")
    .get();

  const now = new Date();
  let expired = 0;
  let needsFollowUp = 0;
  const alerts: { id: string; businessName: string; message: string; daysSince: number }[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.webSentAt) continue;

    const sent = new Date(data.webSentAt);
    const daysSince = Math.floor(
      (now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince >= 10) {
      await doc.ref.update({
        status: "not_interested",
        statusHistory: [
          ...(data.statusHistory || []),
          {
            status: "not_interested",
            date: now.toISOString(),
            note: "Expirado automaticamente tras 10+ dias sin respuesta",
          },
        ],
        followUpDue: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      expired++;
    } else if (daysSince >= 7) {
      const day7 = new Date(sent);
      day7.setDate(day7.getDate() + 7);
      await doc.ref.update({
        followUpDue: day7.toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      alerts.push({
        id: doc.id,
        businessName: data.businessName,
        message: `Ultimo intento con ${data.contactName || data.businessName}: "La web sigue disponible, te la guardo hasta el viernes"`,
        daysSince,
      });
      needsFollowUp++;
    } else if (daysSince >= 3) {
      const day3 = new Date(sent);
      day3.setDate(day3.getDate() + 3);
      await doc.ref.update({
        followUpDue: day3.toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      alerts.push({
        id: doc.id,
        businessName: data.businessName,
        message: `Enviar follow-up a ${data.contactName || data.businessName}: "¿Pudiste ver la seccion de servicios? Si queres cambiar algo lo hacemos"`,
        daysSince,
      });
      needsFollowUp++;
    }
  }

  return NextResponse.json({ expired, needsFollowUp, alerts });
});
