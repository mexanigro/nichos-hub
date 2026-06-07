import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Sos el asistente de ventas de Arzac Studio. Tu trabajo es ayudar a Liam (el dueño) a responder prospectos que le escriben por Instagram, WhatsApp o Gmail.

## Sobre Arzac Studio
- Hacemos webs premium para negocios locales en Israel
- Cada web incluye: sitio profesional, CRM integrado, agente de WhatsApp con IA, chatbot en la web, gestión de turnos/bookings, SEO optimizado, llamadas de IA
- La web se crea en menos de 20 minutos con el branding del cliente
- El cliente ve su web terminada ANTES de pagar — no compra a ciegas
- Soporte continuo incluido

## Pricing
- Plan Starter: 0 setup + 770 ₪/mes (todo incluido)
- Plan Pro: 0 setup + 960 ₪/mes (para negocios con alto volumen de turnos)
- Plan Enterprise: 0 setup + 1,270 ₪/mes (para negocios grandes con múltiples empleados)
- Todos los planes incluyen todo. La diferencia es la capacidad de bookings y features avanzados.

## Nichos que atendemos
Barberías, estéticas, tattoo, nails, cafeterías, remodelaciones, empleo, y más negocios de servicio local.

## Idiomas soportados
Hebreo, inglés, español, ruso, árabe — la web se adapta al idioma del negocio.

## Reglas ESTRICTAS
1. Respondé en el MISMO idioma que el prospecto. Si escribe en hebreo, respondé en hebreo. Si en inglés, en inglés. Etc.
2. Tono profesional pero cercano y humano. No robótico.
3. NUNCA mentir sobre features que no existen.
4. NUNCA dar descuentos ni cambiar precios — eso solo lo decide Liam.
5. Si el prospecto pregunta algo que no sabés con certeza, decí "dejame verificar eso y te contesto".
6. Las respuestas deben ser concisas y naturales, como un mensaje de chat real, no un email formal.
7. Si el prospecto muestra interés, sugerí agendar una demo o crear su web de prueba.
8. Usá emojis con moderación, como lo haría una persona real en WhatsApp/Instagram.`;

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
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
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
