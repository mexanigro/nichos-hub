import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

export interface LogoInput {
  businessName: string;
  niche: string;
  colors: string;
  description: string;
}

/**
 * Detailed niche-specific design briefs.
 * Each includes: visual motifs, typography direction, color psychology,
 * composition style, and SVG-specific technical guidance.
 */
const NICHE_BRIEFS: Record<string, string> = {
  barberia: `BARBERSHOP / BARBER LOGO BRIEF:
Visual motifs: scissors (open or crossed), straight razor, barber pole stripes, mustache silhouette, vintage badge/crest shape, laurel wreath frame.
Typography: Bold serif (Playfair-style) or strong slab-serif for the name. ALL CAPS works well. Consider a monogram if the name is short.
Color psychology: Deep navy/black backgrounds with gold/brass accents convey premium masculinity. Red+white+blue for classic barber heritage.
Composition: Circular badge or shield shape works best. Symmetrical layout. The name should be prominent and readable.
Style reference: Think vintage barbershop signage, old-school gentleman's club aesthetics.
SVG tips: Use a circle or rounded rect as the badge container. Decorative border with thin strokes. Text should be at least 16px.`,

  estetica: `BEAUTY SALON / AESTHETICS LOGO BRIEF:
Visual motifs: Minimalist leaf/petal, abstract face silhouette, elegant single-line art, butterfly, lotus flower, crescent moon.
Typography: Thin elegant sans-serif or modern light-weight serif for sophistication. Title case or lowercase for approachability. Consider letter-spacing for elegance.
Color psychology: Soft rose/blush, lavender, champagne gold, dusty pink, mauve. White space is essential.
Composition: Clean, minimalist, lots of breathing room. Icon above text or integrated into a letter. Horizontal layout.
Style reference: Think luxury skincare brands, high-end spa aesthetics, clean beauty packaging.
SVG tips: Use thin strokes (1-2px) for line art motifs. Subtle curves. Avoid heavy fills. Elegant negative space.`,

  tattoo: `TATTOO STUDIO LOGO BRIEF:
Visual motifs: Rose with thorns, dagger/knife, skull, snake, traditional tattoo flash elements, ink drop, tattoo machine silhouette.
Typography: Bold blackletter/gothic for studio name, or strong hand-drawn style. Grungy textures implied through varied stroke weights.
Color psychology: Dominant black with red accents, or all-black monochrome. Dark and bold. No pastels.
Composition: Badge/emblem style, or stacked text with central icon. Symmetrical or slightly asymmetrical for edginess.
Style reference: Think traditional American tattoo flash art, biker culture, old-school tattoo parlor signs.
SVG tips: Use bold strokes (2-3px). Strong contrast. Detailed but clean paths. Black fills with minimal accent colors.`,

  nails: `NAIL SALON LOGO BRIEF:
Visual motifs: Nail polish bottle silhouette, hand with manicured nails, geometric gem/diamond shape, star sparkle, minimalist flower.
Typography: Modern sans-serif (clean, geometric) or playful rounded font. Mix of weights (thin name + bold tagline).
Color psychology: Hot pink, coral, nude/blush, holographic-inspired gradients, rose gold accents.
Composition: Icon + wordmark side by side, or stacked. Clean and modern. Instagram-friendly proportions.
Style reference: Think trendy nail art Instagram accounts, K-beauty brands, modern salon branding.
SVG tips: Use simple geometric shapes. Consider a linear gradient for accent elements. Keep it clean and scalable.`,

  cafeteria: `COFFEE SHOP / CAFÉ LOGO BRIEF:
Visual motifs: Coffee bean, steaming cup, coffee plant leaf, mountain/origin, latte art swirl, croissant, simple mug silhouette.
Typography: Warm serif with personality, or friendly rounded sans-serif. Handwritten/script accent for the tagline. Mixed weights create warmth.
Color psychology: Warm browns, cream, burnt orange, forest green, deep espresso. Earthy and inviting.
Composition: Circular emblem (like Starbucks-style), or horizontal wordmark with small icon. Vintage badge or modern minimal.
Style reference: Think specialty coffee roasters, artisan bakeries, third-wave coffee shops.
SVG tips: Use a circular container. Warm tones. Include a subtle coffee-related icon. Text should feel handcrafted but readable.`,

  remodelaciones: `HOME RENOVATION / CONSTRUCTION LOGO BRIEF:
Visual motifs: House/roofline silhouette, geometric building blocks, hammer/wrench (subtle), window frame, architectural lines, blueprint-style elements.
Typography: Strong geometric sans-serif (Montserrat/Raleway style). Bold weight for trustworthiness. Clean and professional.
Color psychology: Steel blue, slate gray, deep green, orange/amber accents for energy. Professional and trustworthy.
Composition: Horizontal with icon on left, or stacked. Clean architectural lines. Professional and structured.
Style reference: Think construction company branding, architecture firms, premium home improvement brands.
SVG tips: Use clean geometric shapes. Straight lines and right angles. Professional grid-like composition. Bold, confident design.`,
};

/**
 * Generate an SVG logo using Claude Haiku with a detailed design brief.
 * Two-step approach: builds a rich prompt from niche expertise + user data,
 * then generates a polished SVG.
 *
 * Returns a data URL ready for <img src="...">.
 * Cost: ~$0.003 per generation.
 */
export async function generateLogoSvg(input: LogoInput): Promise<string> {
  const nicheBrief = NICHE_BRIEFS[input.niche] || `PROFESSIONAL BUSINESS LOGO:
Design a clean, modern logo that conveys professionalism and trust.
Use geometric shapes, clean typography, and a minimal color palette.`;

  // Build the full context
  const contextParts: string[] = [
    `Business name: "${input.businessName}"`,
    `Industry: ${input.niche}`,
  ];

  if (input.description) {
    contextParts.push(`Business description: ${input.description}`);
  }

  if (input.colors) {
    contextParts.push(`Client's preferred colors: ${input.colors} — incorporate these colors into the design.`);
  } else {
    contextParts.push(`No specific color preference — use colors appropriate for the industry as described in the brief.`);
  }

  const response = await getAnthropicClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    system: `You are an expert logo designer who creates SVG logos for small businesses. Your logos are clean, professional, and look great at any size.

DESIGN BRIEF FOR THIS INDUSTRY:
${nicheBrief}

SVG TECHNICAL REQUIREMENTS:
- Output ONLY raw SVG markup. No markdown, no explanation, no backticks.
- Self-contained SVG (no external fonts, images, links, or references).
- viewBox="0 0 200 200"
- Maximum 4KB total.
- Include the business name as text using font-family="Arial, Helvetica, sans-serif".
- Use at most 3-4 colors.
- Text must be legible at 32x32px (minimum font-size 14px for the main name).
- NO <image>, <foreignObject>, <use> with external refs, or any external resources.
- NO XML declaration or DOCTYPE.
- Use clean <path>, <circle>, <rect>, <text>, <g> elements.
- All shapes should have clean, intentional geometry.

QUALITY STANDARDS:
- The logo must look like it was designed by a professional.
- Balance between icon/motif and text.
- Good visual hierarchy — the business name should be the most prominent element.
- The design should work in both color and monochrome.
- Avoid generic clip-art style — make it feel custom and intentional.`,
    messages: [
      {
        role: "user",
        content: `Create a professional logo with these specifications:\n\n${contextParts.join("\n")}\n\nGenerate the SVG now.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Extract SVG from response
  let svg = text.trim();
  const svgMatch = svg.match(/<svg[\s\S]*<\/svg>/i);
  if (svgMatch) {
    svg = svgMatch[0];
  }

  // Validate
  if (!svg.startsWith("<svg") || !svg.includes("</svg>")) {
    throw new Error("Claude did not return valid SVG");
  }

  // Ensure viewBox
  if (!svg.includes("viewBox")) {
    svg = svg.replace("<svg", '<svg viewBox="0 0 200 200"');
  }

  // Ensure xmlns
  if (!svg.includes("xmlns")) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Encode as data URL
  const base64 = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}
