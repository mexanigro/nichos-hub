import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withOwner } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { db } from "@/lib/firebase-admin";
import {
  isValidClientLanguage,
  normalizeClientLanguage,
  CLIENT_LANGUAGE_NAME_EN,
  type ClientLanguage,
} from "@/lib/client-language";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const NICHE_CONTEXT: Record<string, string> = {
  barberia: "barbershop / men's grooming salon",
  estetica: "beauty salon / aesthetics clinic",
  tattoo: "tattoo and piercing studio",
  nails: "nail salon / manicure studio",
  cafeteria: "artisanal café / coffee shop",
  remodelaciones: "home remodeling / painting company",
};

const OUTPUT_SCHEMA = `{
  "hero.titlePrefix": "short prefix (2-4 words)",
  "hero.titleHighlight": "main highlighted title (2-5 words)",
  "hero.titleSuffix": "optional suffix",
  "hero.subtitle": "one compelling sentence about the business",
  "hero.ctaPrimary": "primary CTA button text",
  "hero.ctaSecondary": "secondary CTA text",
  "sections.services.title": "services section title",
  "sections.services.subtitle": "services section subtitle",
  "sections.whyChooseUs.title": "why choose us title",
  "sections.whyChooseUs.subtitle": "why choose us subtitle",
  "sections.team.title": "team section title",
  "sections.team.subtitle": "team subtitle",
  "sections.testimonials.title": "testimonials title",
  "sections.testimonials.subtitle": "testimonials subtitle",
  "sections.gallery.title": "gallery title",
  "sections.gallery.subtitle": "gallery subtitle",
  "sections.location.title": "location title",
  "sections.location.subtitle": "location subtitle",
  "sections.contact.title": "contact title",
  "sections.contact.subtitle": "contact subtitle",
  "sections.booking.title": "booking title",
  "sections.booking.tagline": "booking tagline"
}`;

const CAFETERIA_FIELDS = `
  "sections.philosophy.title": "philosophy section title",
  "sections.philosophy.subtitle": "philosophy subtitle",
  "sections.philosophy.intro": "one paragraph about the café's philosophy",
  "sections.process.title": "process section title",
  "sections.process.subtitle": "process subtitle",
  "sections.ambience.title": "ambience section title",
  "sections.ambience.subtitle": "ambience subtitle"`;

const REMODELACIONES_FIELDS = `
  "sections.portfolio.title": "portfolio section title",
  "sections.portfolio.subtitle": "portfolio subtitle",
  "sections.process.title": "process section title",
  "sections.process.subtitle": "process subtitle"`;

export const POST = withOwner(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "generate-content", 5, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { niche, businessDescription, clientId } = body;

    if (!businessDescription || typeof businessDescription !== "string") {
      return NextResponse.json({ error: "Business description required" }, { status: 400 });
    }

    // Idioma del output — el LLM debe responder en el idioma del cliente, NO
    // en el del businessDescription. Liam suele tipear el contexto en español
    // pero el sitio del cliente es en hebreo. Prioridad:
    //   1. body.language (explícito desde el frontend)
    //   2. hub_clients/{clientId}.language
    //   3. config/{clientId}.language
    //   4. default ("he", Israel)
    let resolvedLanguage: ClientLanguage | undefined;
    if (isValidClientLanguage(body.language)) {
      resolvedLanguage = body.language;
    } else if (body.language !== undefined) {
      return NextResponse.json(
        { error: "Idioma inválido. Valores aceptados: he, en, ru, ar, es." },
        { status: 400 },
      );
    } else if (typeof clientId === "string" && clientId.length > 0) {
      try {
        const [hubSnap, cfgSnap] = await Promise.all([
          db.collection("hub_clients").doc(clientId).get(),
          db.collection("config").doc(clientId).get(),
        ]);
        const hubLang = hubSnap.data()?.language;
        const cfgLang = cfgSnap.data()?.language;
        if (isValidClientLanguage(hubLang)) resolvedLanguage = hubLang;
        else if (isValidClientLanguage(cfgLang)) resolvedLanguage = cfgLang;
      } catch (err) {
        console.error("[generate-content] failed to read client language:", err);
      }
    }
    const language: ClientLanguage = resolvedLanguage ?? normalizeClientLanguage(undefined);
    const languageName = CLIENT_LANGUAGE_NAME_EN[language];

    const nicheDesc = NICHE_CONTEXT[niche] || "local service business";
    let schema = OUTPUT_SCHEMA;
    if (niche === "cafeteria") {
      schema = schema.replace(/\n\}$/, `,${CAFETERIA_FIELDS}\n}`);
    } else if (niche === "remodelaciones") {
      schema = schema.replace(/\n\}$/, `,${REMODELACIONES_FIELDS}\n}`);
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: `You are a marketing copywriter for a ${nicheDesc} website. Generate ALL content in ${languageName}. The user's input may be in any language but your output MUST be in ${languageName}. Keep texts concise and impactful. Respond ONLY with a JSON object matching this exact schema:\n${schema}`,
      messages: [
        {
          role: "user",
          content: `Business description:\n${businessDescription.slice(0, 1000)}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const generated = JSON.parse(jsonMatch[0]);
    return NextResponse.json(generated);
  } catch (err) {
    console.error("[generate-content] error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
});
