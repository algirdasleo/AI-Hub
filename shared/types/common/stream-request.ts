import z from "zod";
import { AIProvider, AIProviderSchema } from "../../config/index.js";

export const ModelSettingsSchema = z
  .object({
    maxOutputTokens: z.number().optional(),
    temperature: z.number().optional(),
  })
  .optional();

export const ModelConfigSchema = z.strictObject({
  provider: z.enum(AIProvider, {
    error: "Invalid AI provider. Valid providers: " + AIProviderSchema.options.join(", "),
  }),
  modelId: z.string().min(1),
  settings: ModelSettingsSchema,
});

export const BaseStreamRequestSchema = z.strictObject({
  conversationId: z.uuid().optional(),
  prompt: z.string().min(1, { error: "Prompt cannot be empty" }),
  systemPrompt: z.string().optional(),
  useWebSearch: z.boolean().optional().default(false),
  title: z.string().optional(),
});
