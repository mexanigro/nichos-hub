import Anthropic from "@anthropic-ai/sdk";
import type { MessageCategory } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ClassificationResult {
  category: MessageCategory;
  reason: string;
}

export async function classifyMessage(message: string): Promise<ClassificationResult> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    system: `Classify the following client message into exactly one category:
- "maintenance": requests about website changes, updates, design modifications, content edits
- "support": technical issues, bugs, errors, something not working
- "conversation": general questions, feedback, greetings, anything else

Respond with JSON only: {"category": "...", "reason": "..."}
The reason should be one short sentence in Spanish.`,
    messages: [{ role: "user", content: message }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(text);

  return {
    category: parsed.category as MessageCategory,
    reason: parsed.reason,
  };
}
