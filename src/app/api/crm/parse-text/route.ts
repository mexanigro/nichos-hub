import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CUSTOMER_PROMPT = `Extract customer data from the following text. The text may be from WhatsApp messages, handwritten notes, Excel exports, or any informal source.

For each customer found, extract:
- fullName (required)
- email (if found)
- phone (if found — keep original format with country code if present)
- tags (comma-separated: VIP, regular, nuevo, etc.)
- notes (any extra info about this person)
- visitCount (estimated number if mentioned)
- paymentMethod (cash, card, transfer if mentioned)

Return ONLY a JSON array. No explanation. Example:
[{"fullName":"David Cohen","phone":"+972-50-123-4567","email":"david@gmail.com","tags":"VIP,regular","notes":"Prefiere corte fade","visitCount":5,"paymentMethod":"cash"}]

If no customers are found, return an empty array: []`;

const APPOINTMENT_PROMPT = `Extract appointment/booking data from the following text. The text may be from WhatsApp messages, a calendar, handwritten notes, or any informal source.

For each appointment found, extract:
- customerName (required)
- customerEmail (if found)
- customerPhone (if found)
- date (YYYY-MM-DD format — infer year as current year if not specified)
- time (HH:mm 24h format)
- serviceId (lowercase-kebab, e.g. "haircut", "beard-sculpt", "full-ritual", "color-treatment")
- staffId (lowercase, first name of the professional if mentioned)
- duration (in minutes if mentioned, default 30)
- status (completed, confirmed, pending, cancelled — infer from context)
- amountPaidCents (amount in cents if price mentioned)

Return ONLY a JSON array. No explanation. Example:
[{"customerName":"David Cohen","date":"2025-05-20","time":"10:00","serviceId":"haircut","staffId":"alex","duration":30,"status":"completed","amountPaidCents":4500}]

If no appointments are found, return an empty array: []`;

/**
 * POST /api/crm/parse-text
 * Uses AI to extract structured CRM data from free-form text.
 * Body: { text: string, targetType: "customers"|"appointments" }
 */
export const POST = withOwner(async (req) => {
  const { text, targetType } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "text requerido" }, { status: 400 });
  }
  if (!targetType || !["customers", "appointments"].includes(targetType)) {
    return NextResponse.json({ error: "targetType debe ser 'customers' o 'appointments'" }, { status: 400 });
  }
  if (text.length > 50000) {
    return NextResponse.json({ error: "Texto demasiado largo (max 50,000 caracteres)" }, { status: 400 });
  }

  const systemPrompt = targetType === "customers" ? CUSTOMER_PROMPT : APPOINTMENT_PROMPT;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "[]";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ rows: [], confidence: 0 });
    }

    const rows = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(rows)) {
      return NextResponse.json({ rows: [], confidence: 0 });
    }

    // Calculate rough confidence based on how many required fields are present
    let filledFields = 0;
    let totalRequired = 0;
    for (const row of rows) {
      if (targetType === "customers") {
        totalRequired += 3; // fullName, email, phone
        if (row.fullName) filledFields++;
        if (row.email) filledFields++;
        if (row.phone) filledFields++;
      } else {
        totalRequired += 4; // customerName, date, time, serviceId
        if (row.customerName) filledFields++;
        if (row.date) filledFields++;
        if (row.time) filledFields++;
        if (row.serviceId) filledFields++;
      }
    }
    const confidence = totalRequired > 0 ? Math.round((filledFields / totalRequired) * 100) : 0;

    return NextResponse.json({ rows, confidence });
  } catch (err) {
    console.error("[crm/parse-text]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Error al analizar el texto" }, { status: 500 });
  }
});
