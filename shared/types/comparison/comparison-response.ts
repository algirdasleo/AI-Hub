import { z } from "zod";

export const ComparisonJobResponseSchema = z.strictObject({
  uid: z.string(),
  conversationId: z.uuid(),
});

export type ComparisonJobResponse = z.infer<typeof ComparisonJobResponseSchema>;
