import { z } from "zod";

export const ComparisonConversationSchema = z.strictObject({
  id: z.uuid(),
  user_id: z.uuid().optional(),
  title: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type ComparisonConversation = z.infer<typeof ComparisonConversationSchema>;

export const ComparisonOutputSchema = z.strictObject({
  id: z.uuid(),
  model: z.string(),
  role: z.string(),
  content: z.string(),
  created_at: z.coerce.date(),
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
