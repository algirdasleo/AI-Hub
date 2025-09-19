import z from "zod";

export const TokenUsageSchema = z.object({
  inputTokens: z.number().min(0).describe("Number of prompt tokens used"),
  outputTokens: z.number().min(0).describe("Number of completion tokens used"),
  totalTokens: z.number().min(0).describe("Total number of tokens used"),
});

export type TokenUsage = z.infer<typeof TokenUsageSchema>;
