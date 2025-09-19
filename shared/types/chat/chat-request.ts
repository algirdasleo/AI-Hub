import z from "zod";
import { UIMessageSchema } from "./index.js";
import { AIProvider, AIProviderSchema } from "../../config/index.js";

export const ModelSchema = z.strictObject({
  provider: z.enum(AIProvider, {
    error: "Invalid AI provider. Valid providers: " + AIProviderSchema.options.join(", "),
  }),
  modelId: z.string().min(1),
  settings: z
    .object({
      maxOutputTokens: z.number().optional(),
      temperature: z.number().optional(),
    })
    .optional(),
  messages: z.array(UIMessageSchema).min(1, { error: "Messages array cannot be empty" }),
});

export type Model = z.infer<typeof ModelSchema>;

export const ChatStreamSchema = z.strictObject({
  model: ModelSchema,
  systemPrompt: z.string().optional(),
  useWebSearch: z.boolean().optional().default(false),
});

export type ChatStreamParams = z.infer<typeof ChatStreamSchema>;
