import { z } from "zod";

export const ComparisonConversationSchema = z.strictObject({
  id: z.uuid(),
  user_id: z.uuid().optional(),
  title: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type ComparisonConversation = z.infer<typeof ComparisonConversationSchema>;

export const ComparisonOutputStatsSchema = z.strictObject({
  id: z.uuid(),
  tokens_used: z.number(),
  cost_usd: z.number(),
  latency_ms: z.number().nullable(),
});

export type ComparisonOutputStats = z.infer<typeof ComparisonOutputStatsSchema>;

export const ComparisonOutputSchema = z.strictObject({
  id: z.uuid(),
  model: z.string(),
  role: z.string(),
  content: z.string(),
  created_at: z.coerce.date(),
  stats: z.array(ComparisonOutputStatsSchema).default([]).optional(),
});

export type ComparisonOutput = z.infer<typeof ComparisonOutputSchema>;

export const ComparisonPromptSchema = z.strictObject({
  id: z.uuid(),
  content: z.string(),
  created_at: z.coerce.date(),
  outputs: z.array(ComparisonOutputSchema).default([]),
});

export type ComparisonPrompt = z.infer<typeof ComparisonPromptSchema>;

export type GetComparisonConversationsResponseDTO = ComparisonConversation[];
export type GetComparisonPromptsResponseDTO = ComparisonPrompt[];
