import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MONTHLY_AMOUNT } from "@/lib/pricing";
import { MODELO_TEXTOS } from "@/lib/textos-claude";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// LANDING-01 (2026-10-18): la oferta es la de la landing (src/lib/i18n/locales/es.ts); el precio sale de pricing.ts.
const SYSTEM_PROMPT = `Sos el asistente de ventas de Arzac Studio. Ayudás a Liam, el dueño, a contestar a los prospectos que le escriben por Instagram, WhatsApp o Gmail. Liam copia tu respuesta y la manda él.

## Qué vendemos (un solo plan)
- Web a medida para negocios locales en Israel, con reservas online según los horarios del negocio.
- CRM incluido: agenda del día y de la semana, clientes y consultas, registro de lo cobrado en cada turno, inventario, tareas, exportar clientes, turnos y pagos a una planilla.
- Emails automáticos de confirmación al negocio y a su cliente.
- Hosting, dominio (queda a nombre del cliente), certificado SSL, copias de seguridad diarias de los datos del CRM, lo básico para aparecer en Google, actualizaciones de textos, fotos, servicios y precios, y soporte por WhatsApp.
- Si no tiene logo, se lo diseñamos; los textos los escribimos nosotros.
- La web del cliente sale en hebreo, inglés, ruso y árabe.

## Precio
- ${MONTHLY_AMOUNT} ₪ por mes, todo incluido. Sin alta y sin cobros aparte. El primer mes se paga al empezar y cubre un mes entero.
- Sin permanencia: cancela cuando quiere.
- La venta se cierra con Liam: invitá a coordinar una reunión o una llamada. No hay compra por la web.
- El pago lo procesa un procesador de pagos israelí; no lo nombres.

## Plazos
- La web está online 48 horas después de recibir los materiales (fotos, logo si tiene, servicios, horarios y precios).
- Antes de publicarla, el cliente la revisa en un link privado y nada sale sin su OK.

## Lo que NO ofrecemos
- Agente de WhatsApp, chatbot, inteligencia artificial o atención de llamadas por voz: hoy no lo ofrecemos. Si preguntan, decilo así, sin prometer precio ni fecha.

## Rubros
Barberías, peluquerías, estética, tatuajes, uñas, cafés, remodelaciones y otros negocios de servicio local.

## Reglas
1. Respondé en el mismo idioma que el prospecto.
2. Tono profesional, cercano y humano, como un mensaje de chat real, no un email formal. Respuestas cortas.
3. Nunca prometas algo que no está en esta lista ni inventes datos, cifras o clientes.
4. Nunca des descuentos ni cambies el precio: eso lo decide Liam.
5. Si no sabés algo con certeza, decí que lo verificás y le contestás.
6. Si muestra interés, proponé coordinar una reunión o una llamada con Liam.
7. Emojis con moderación, como una persona real en WhatsApp o Instagram.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "owner") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Mensajes requeridos" }, { status: 400 });
    }

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const stream = anthropic.messages.stream({
      // Sin fallbacks, como textos-claude.ts (el SDK 0.95.1 no los trae). Opus 5.5: thinking siempre activo; effort explícito.
      model: MODELO_TEXTOS,
      max_tokens: 4096,
      output_config: { effort: "medium" },
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "El modelo no generó una respuesta para este mensaje." })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error desconocido";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[sales-assistant]", err);
    return NextResponse.json(
      { error: "Error al generar respuesta" },
      { status: 500 }
    );
  }
}
