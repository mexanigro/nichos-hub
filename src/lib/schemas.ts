import { z } from "zod";

const E164 = z.string().regex(/^\+[1-9]\d{6,14}$/, "Formato E.164 requerido (ej: +972501234567)");

const VALID_TONES = ["amigable", "profesional", "casual"] as const;
const VALID_LANGS = ["auto", "es", "he", "en", "ru"] as const;

export const whatsAppConfigSchema = z.object({
  clientId: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional(),
  enabled: z.boolean(),
  twilio: z.object({
    phoneNumber: z.union([E164, z.literal("")]),
  }),
  systemPrompt: z.string().max(5000),
  personality: z.object({
    tone: z.enum(VALID_TONES),
    useEmojis: z.boolean(),
    language: z.enum(VALID_LANGS),
  }),
  adminPhones: z.array(E164).max(10),
  pauseState: z.object({
    paused: z.boolean(),
    pausedAt: z.string().nullable(),
    resumeAt: z.string().nullable(),
  }),
  leads: z.record(z.string(), z.string()).optional(),
}).refine(
  (data) => !data.enabled || (data.twilio.phoneNumber && data.twilio.phoneNumber !== ""),
  { message: "Para habilitar el agente necesitas un numero Twilio", path: ["twilio", "phoneNumber"] },
);

export type WhatsAppConfigInput = z.infer<typeof whatsAppConfigSchema>;

const templateStatusEnum = z.enum(["draft", "pending", "approved", "rejected"]);

const templateConfigSchema = z.object({
  enabled: z.boolean(),
  twilioTemplateSid: z.string().max(100),
  status: templateStatusEnum,
  lastSynced: z.string().optional(),
});

const reminderTemplateSchema = templateConfigSchema.extend({
  hoursBefore: z.number().min(0.5).max(72),
});

export const whatsAppTemplatesSchema = z.object({
  clientId: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional(),
  templates: z.object({
    reminder_24h: reminderTemplateSchema,
    reminder_1h: reminderTemplateSchema,
    booking_confirmed: templateConfigSchema,
    booking_cancelled: templateConfigSchema,
  }),
});

export type WhatsAppTemplatesInput = z.infer<typeof whatsAppTemplatesSchema>;

const VOICE_LANGS = ["he", "en", "es", "ru", "ar"] as const;
const VOICE_MODELS = ["male", "female"] as const;

export const voiceConfigSchema = z.object({
  clientId: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional(),
  enabled: z.boolean(),
  twilio: z.object({
    phoneNumber: z.union([E164, z.literal("")]),
  }),
  voice: z.object({
    model: z.enum(VOICE_MODELS),
    language: z.enum(VOICE_LANGS),
  }),
  systemPrompt: z.string().max(5000),
  greeting: z.string().max(500),
  transferNumber: z.union([E164, z.literal("")]),
}).refine(
  (data) => !data.enabled || (data.twilio.phoneNumber && data.twilio.phoneNumber !== ""),
  { message: "Para habilitar Voice AI necesitas un numero Twilio", path: ["twilio", "phoneNumber"] },
);

export type VoiceConfigInput = z.infer<typeof voiceConfigSchema>;
