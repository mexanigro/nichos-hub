import { NextRequest, NextResponse } from "next/server";
import { processCardcomPayment } from "@/lib/cardcom-promote";

/**
 * Webhook server-to-server de Cardcom (IndicatorUrl).
 *
 * Cardcom NO firma estos requests con HMAC. La forma estandar de validar es
 * re-llamar a BillGoldGetLowProfileIndicator.aspx usando el lowProfileCode
 * recibido — si Cardcom confirma el pago, es valido. Eso es exactamente lo
 * que hace processCardcomPayment().
 *
 * Cardcom puede llamar a este endpoint con:
 *   - POST form-urlencoded (mas comun)
 *   - GET con query params (algunos terminales)
 *
 * Campos esperados en el payload de Cardcom (parcial):
 *   - lowprofilecode (GUID)
 *   - ReturnValue (nuestro leadId, lo pusimos en el create)
 *   - OperationResponse, DealResponse, etc.
 *
 * Idempotencia: si el lead ya esta paid, processCardcomPayment retorna
 * alreadyProcessed=true sin volver a tocar Firestore. Esto cubre el caso
 * comun de Cardcom reintentando el webhook + el client-side verify llegando
 * primero.
 */
async function handle(req: NextRequest, params: Record<string, string>) {
  // Normalizar nombres de campos (Cardcom mezcla casing entre endpoints)
  const lowProfileCode =
    params.lowprofilecode ||
    params.LowProfileCode ||
    params.lowProfileCode ||
    "";

  const leadId =
    params.ReturnValue ||
    params.returnValue ||
    params.returnvalue ||
    "";

  if (!lowProfileCode || !leadId) {
    console.warn("[cardcom/webhook] missing fields", {
      hasLowProfileCode: !!lowProfileCode,
      hasReturnValue: !!leadId,
      keys: Object.keys(params),
    });
    // 200 OK para que Cardcom no reintente eternamente — el error es de payload
    return NextResponse.json({ ok: false, reason: "missing_fields" });
  }

  const result = await processCardcomPayment(leadId, lowProfileCode);

  if (!result.ok) {
    console.error("[cardcom/webhook] process failed", { leadId, reason: result.reason });
    // 200 OK aunque haya fallado, para evitar reintentos infinitos.
    // El error queda persistido en hub_contract_leads.paymentStatus="failed".
    return NextResponse.json({ ok: false, reason: result.reason });
  }

  return NextResponse.json({
    ok: true,
    alreadyProcessed: result.alreadyProcessed || false,
    clientId: result.clientId,
  });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  let params: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    try {
      params = (await req.json()) as Record<string, string>;
    } catch {
      params = {};
    }
  } else {
    // form-urlencoded o multipart — leemos como texto y parseamos
    const text = await req.text();
    params = Object.fromEntries(new URLSearchParams(text));
  }

  // Tambien incluir query params (Cardcom a veces los pone en la URL)
  const urlParams = Object.fromEntries(req.nextUrl.searchParams);
  params = { ...urlParams, ...params };

  return handle(req, params);
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  return handle(req, params);
}
