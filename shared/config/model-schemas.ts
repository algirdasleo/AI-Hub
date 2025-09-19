import { z } from "zod";
import { ModelMessage, modelMessageSchema } from "ai";

export enum AIProvider {
  OpenAI = "OpenAI",
  Anthropic = "Anthropic",
  Google = "Google",
}
export const AIProviderSchema = z.enum(AIProvider);

export const ModelSettingsSchema = z.strictObject({
  maxOutputTokens: z.number().min(1).optional(),
  temperature: z.number().min(0).max(1).optional(),
});
export type ModelSettings = z.infer<typeof ModelSettingsSchema>;

export const SelectedModelSchema = z.strictObject({
  provider: AIProviderSchema,
  modelId: z.string(),
  settings: z.optional(ModelSettingsSchema),
});
export type SelectedModel = z.infer<typeof SelectedModelSchema>;

export const AIModelSchema = z.strictObject({
  name: z.string(),
  id: z.string(),
  provider: AIProviderSchema,
  maxTokens: z.number(),
  contextWindow: z.number(),
  description: z.string().optional(),
});
export type AIModel = z.infer<typeof AIModelSchema>;
