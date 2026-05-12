import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const GET = withOwner(async () => {

  const snap = await db
    .collection("hub_expenses")
    .orderBy("date", "desc")
    .get();

  const rows = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      fecha: d.date,
      categoria: d.category,
      descripcion: d.description,
      monto: d.amount,
      metodo_pago: d.paymentMethod || "",
      creado_por: d.createdBy,
    };
  });

  const headers = ["fecha", "categoria", "descripcion", "monto", "metodo_pago", "creado_por"];
  const csvLines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = String(r[h as keyof typeof r] ?? "");
          return val.includes(",") || val.includes('"')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(",")
    ),
  ];

  const csv = csvLines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=gastos-${new Date().toISOString().slice(0, 10)}.csv`,
    },
  });
});
