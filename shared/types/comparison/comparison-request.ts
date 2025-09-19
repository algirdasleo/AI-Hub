import z from "zod";
import { ModelSchema } from "@shared/types/chat/chat-request.js";

export const ComparisonStreamSchema = z.strictObject({
  models: z.array(ModelSchema).min(2, { error: "At least two models must be provided for comparison" }),
  systemPrompt: z.string().optional(),
  useWebSearch: z.boolean().optional().default(false),
});

export type ComparisonStreamParams = z.infer<typeof ComparisonStreamSchema>;
